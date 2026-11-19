// POST /api/chat — the chat assistant. The browser sends the whole (short)
// conversation each time; nothing is stored here except counters (limits.ts).
// Replies come from Claude, answering only from the site's own fact sheet,
// and pass through filterReply() before the visitor sees them.
//
// Request:  { conversationId, page, messages: [{ role: 'user'|'assistant', content }] }
// Response: { reply, leadCreated?, limit?, disabled? }  (+ debug outside Production)
//
// Settings: ANTHROPIC_API_KEY, CHAT_ENABLED=true, CHAT_MODEL (default
// claude-sonnet-5-5), plus the Salesforce and Redis settings (.env.example).

import Anthropic from '@anthropic-ai/sdk';
import { denyTerms, env, isProduction, leadMode, onVercel, salesforceConfig } from './_lib/config.js';
import { filterReply, safeReply } from './_lib/filter.js';
import { cleanPage, clientIp, json, readJson, requestHost, sameOrigin, siteFor } from './_lib/http.js';
import { sendLead } from './_lib/leads.js';
import { LIMITS, chatLimitHit, claimChatLead, getCounter, visitorId, type ChatLimit } from './_lib/limits.js';
import { CREATE_LEAD_TOOL, SYSTEM_PROMPT, siteNote } from './_lib/prompt.js';
import { validEmail, validPhone, validateChat, type ChatTurn } from './_lib/validate.js';
import { siteFacts } from './_generated/knowledge.js';

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
/** Hard stop on each reply, thinking included. The prompt asks for under ~120 words. */
const MAX_TOKENS = 1024;
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const contactLine = `email ${siteFacts.email}, call ${siteFacts.phone}, or book a 30-minute demo at ${siteFacts.bookingUrl}`;
const UNAVAILABLE = `The assistant isn't available right now. You can ${contactLine}.`;
const LIMIT_TEXT: Record<ChatLimit, string> = {
  conversation: `We've reached the message limit for this chat. To carry on, you can ${contactLine}.`,
  daily: `We've reached today's message limit for this chat. You can ${contactLine}.`,
  site: `The assistant has reached its limit for today. You can ${contactLine}.`,
};

const ALLOWED_HOSTS = [
  new URL(siteFacts.domains.co).hostname,
  `www.${new URL(siteFacts.domains.co).hostname}`,
  new URL(siteFacts.domains.sundial).hostname,
  `www.${new URL(siteFacts.domains.sundial).hostname}`,
];

/** The server-side backup model only exists for some models (not Haiku). */
function fallbackOptions(model: string) {
  return model.startsWith('claude-haiku') ? {} : { betas: [FALLBACK_BETA], fallbacks: 'default' as const };
}

type ToolContext = { conversation: ChatTurn[]; conversationId: string; site: string; page: string };

/** Runs create_lead. Returns the text the model sees as the tool result. */
async function createLead(input: unknown, ctx: ToolContext): Promise<{ text: string; created: boolean }> {
  const i = (input ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof i[k] === 'string' ? (i[k] as string).trim() : '');
  const name = s('name');
  const email = s('email');
  const phone = s('phone');
  const company = s('company');
  const summary = s('summary').slice(0, 2000);

  // The details must be ones the visitor actually typed, never invented.
  const said = ctx.conversation.filter((m) => m.role === 'user').map((m) => m.content);
  const saidLower = said.join('\n').toLowerCase();
  const saidDigits = said.map((m) => m.replace(/\D/g, ''));
  const emailOk = email !== '' && validEmail(email) && saidLower.includes(email.toLowerCase());
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phone !== '' && validPhone(phone) && saidDigits.some((d) => d.includes(phoneDigits));
  const firstWord = name.split(/\s+/)[0]?.toLowerCase() ?? '';
  const nameOk = name.length > 0 && name.length <= 120 && firstWord.length > 0 && saidLower.includes(firstWord);
  if (!nameOk || !(emailOk || phoneOk)) {
    return { text: 'Not sent: a name and an email address or phone number, exactly as the visitor typed them, are required. Ask the visitor for them.', created: false };
  }

  const cfg = salesforceConfig();
  if (!cfg) {
    return { text: `Not sent: the follow-up system is not connected yet. Ask the visitor to ${contactLine}.`, created: false };
  }
  if (!(await claimChatLead(getCounter(), ctx.conversationId))) {
    return { text: 'Already passed to the team earlier in this conversation. Do not send it again.', created: false };
  }
  const mode = leadMode(siteFacts.launched);
  const result = await sendLead(
    {
      name,
      company,
      email: emailOk ? email : '',
      phone: phoneOk ? phone : '',
      description: `Chat assistant summary:\n${summary}`,
      textConsent: false, // The chat never records text-message consent.
      site: ctx.site,
      page: ctx.page,
      channel: 'Chat assistant',
    },
    cfg,
    mode,
  );
  console.log(`chat lead: ${result.ok ? 'sent' : 'failed'} (mode ${mode})`);
  return result.ok
    ? { text: 'Sent. The team will follow up.', created: true }
    : { text: `Not sent: the follow-up system could not be reached. Ask the visitor to ${contactLine}.`, created: false };
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);

  const apiKey = env('ANTHROPIC_API_KEY');
  if (env('CHAT_ENABLED') !== 'true' || !apiKey) return json({ reply: UNAVAILABLE, disabled: true }, 503);

  const counter = getCounter();
  if (onVercel() && !counter.shared) {
    // Without the shared store the per-visitor and site-wide caps can't hold.
    console.error('chat: Redis (Upstash) is not connected; chat refused.');
    return json({ reply: UNAVAILABLE, disabled: true }, 503);
  }

  const checked = validateChat(await readJson(request), LIMITS.chatPerConversation, LIMITS.chatMessageChars);
  if (!checked.ok) return json({ error: checked.errors.chat }, 400);
  const { conversationId, messages: conversation } = checked.value;

  const limit = await chatLimitHit(counter, visitorId(clientIp(request)), conversationId);
  if (limit) return json({ reply: LIMIT_TEXT[limit], limit });

  const page = cleanPage(checked.value.page);
  const site = siteFor(requestHost(request), page);
  const model = env('CHAT_MODEL') ?? DEFAULT_MODEL;
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 25_000 });

  const messages: Anthropic.Beta.BetaMessageParam[] = conversation.map((m) => ({ role: m.role, content: m.content }));
  const call = () =>
    client.beta.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: siteNote(site) },
      ],
      tools: [CREATE_LEAD_TOOL],
      tool_choice: { type: 'auto' },
      messages,
      ...fallbackOptions(model),
    });

  let leadCreated = false;
  let text = '';
  let servedBy = model;
  try {
    let res = await call();
    for (let round = 0; round < 2 && res.stop_reason === 'tool_use'; round++) {
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type !== 'tool_use') continue;
        const out =
          block.name === CREATE_LEAD_TOOL.name
            ? await createLead(block.input, { conversation, conversationId, site, page })
            : { text: 'Unknown tool.', created: false };
        leadCreated ||= out.created;
        results.push({ type: 'tool_result', tool_use_id: block.id, content: out.text, is_error: !out.created });
      }
      messages.push({ role: 'assistant', content: res.content }, { role: 'user', content: results });
      res = await call();
    }
    servedBy = res.model;
    console.log(
      `chat: ${res.model} stop=${res.stop_reason} in=${res.usage.input_tokens} cache_read=${res.usage.cache_read_input_tokens ?? 0} cache_write=${res.usage.cache_creation_input_tokens ?? 0} out=${res.usage.output_tokens}`,
    );
    if (res.stop_reason !== 'refusal') {
      text = res.content
        .flatMap((b) => (b.type === 'text' ? [b.text] : []))
        .join('\n')
        .trim();
    }
  } catch (e) {
    console.error(`chat: Claude API error ${e instanceof Anthropic.APIError ? e.status : ''} ${e instanceof Error ? e.name : ''}`);
    return json({ reply: UNAVAILABLE, error: true }, 502);
  }

  const raw = text;
  if (!text) text = safeReply('general', siteFacts.bookingUrl);
  // Every reply, from the main or the backup model, goes through the same checks.
  const filtered = filterReply(text, { denyTerms: denyTerms(), bookingUrl: siteFacts.bookingUrl, allowedHosts: ALLOWED_HOSTS });

  return json({
    reply: filtered.text,
    leadCreated,
    ...(isProduction() ? {} : { debug: { model: servedBy, filtered: filtered.reason ?? null, raw } }),
  });
}
