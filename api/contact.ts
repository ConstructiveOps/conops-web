// POST /api/contact — the contact form. Validates the fields and forwards them
// to Salesforce Web-to-Lead. GET /api/contact tells the form whether it is
// connected (Salesforce settings present); if not, the form shows the
// "email us or book a demo" fallback.
//
// Responses (JSON):
//   200 { ok: true }                         sent (or honeypot: pretend success)
//   400 { ok: false, errors: {field: msg} }  something to fix in the form
//   403 { ok: false }                        posted from another website
//   429 { ok: false, reason: 'rate' }        too many submissions
//   502 { ok: false, reason: 'send' }        Salesforce could not be reached
//   503 { ok: false, connected: false }      not connected yet

import { leadMode, salesforceConfig } from './_lib/config.js';
import { cleanPage, clientIp, json, readJson, requestHost, sameOrigin, siteFor } from './_lib/http.js';
import { sendLead } from './_lib/leads.js';
import { allowContact, getCounter, visitorId } from './_lib/limits.js';
import { validateContact } from './_lib/validate.js';
import { siteFacts } from './_generated/knowledge.js';

export function GET(): Response {
  return json({ connected: salesforceConfig() !== null });
}

export async function POST(request: Request): Promise<Response> {
  const cfg = salesforceConfig();
  if (!cfg) return json({ ok: false, connected: false }, 503);
  if (!sameOrigin(request)) return json({ ok: false }, 403);

  const body = await readJson(request);
  const checked = validateContact(body);
  if (!checked.ok) return json({ ok: false, errors: checked.errors }, 400);
  const input = checked.value;

  // Bots fill the hidden field. Look successful, create nothing.
  if (input.honeypot) return json({ ok: true });

  const counter = getCounter();
  if (!(await allowContact(counter, visitorId(clientIp(request))))) {
    return json({ ok: false, reason: 'rate' }, 429);
  }

  const page = cleanPage(input.page);
  const mode = leadMode(siteFacts.launched);
  const result = await sendLead(
    {
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      description: input.message,
      textConsent: input.smsConsent,
      site: siteFor(requestHost(request), page),
      page,
      channel: 'Contact form',
    },
    cfg,
    mode,
  );

  // Log the outcome only, never what the visitor typed.
  console.log(`contact: ${result.ok ? 'sent' : 'failed'} (mode ${mode})${result.ok ? '' : `: ${result.error}`}`);
  if (!result.ok) return json({ ok: false, reason: 'send' }, 502);
  return json(mode === 'dry-run' ? { ok: true, dryRun: result.fields } : { ok: true });
}
