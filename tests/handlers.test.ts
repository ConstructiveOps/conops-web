// The two /api functions end to end, with Salesforce and Claude replaced by fakes.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status = 500;
  }
  class Anthropic {
    static APIError = APIError;
    beta = { messages: { create } };
  }
  return { default: Anthropic };
});

import * as contact from '../api/contact';
import * as chat from '../api/chat';
import { MemoryCounter, setCounter } from '../api/_lib/limits';
import { siteFacts } from '../api/_generated/knowledge';

const SF = {
  SF_ORG_ID: '00D000000000001',
  SF_FIELD_TEXT_CONSENT: '00N_TC',
  SF_FIELD_SITE: '00N_SITE',
  SF_FIELD_PAGE: '00N_PAGE',
  SF_FIELD_CHANNEL: '00N_CH',
  SF_FIELD_TEST: '00N_TEST',
};

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://constructiveoperations.com${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.9', ...headers },
    body: JSON.stringify(body),
  });
}

const fetchSpy = vi.fn(async () => new Response('', { status: 200 }));

beforeEach(() => {
  setCounter(new MemoryCounter());
  vi.stubGlobal('fetch', fetchSpy);
  fetchSpy.mockClear();
  create.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const stubSalesforce = () => Object.entries(SF).forEach(([k, v]) => vi.stubEnv(k, v));
const form = { name: 'Pat Example', email: 'pat@example.com', message: 'Hello', smsConsent: true, page: 'https://constructiveoperations.com/contact?x=1' };

describe('/api/contact', () => {
  it('is not connected without the Salesforce settings', async () => {
    expect(await contact.GET().json()).toEqual({ connected: false });
    expect((await contact.POST(post('/api/contact', form))).status).toBe(503);
  });

  it('is connected with them', async () => {
    stubSalesforce();
    expect(await contact.GET().json()).toEqual({ connected: true });
  });

  it('sends a test lead while the site is not launched, even with LEAD_MODE=live', async () => {
    stubSalesforce();
    vi.stubEnv('LEAD_MODE', 'live');
    const res = await contact.POST(post('/api/contact', form));
    expect(res.status).toBe(200);
    const body = new URLSearchParams(String((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(siteFacts.launched).toBe(false);
    expect(body.get('00N_TEST')).toBe('1');
    expect(body.get('description')).toBe('[TEST] Hello');
    expect(body.get('00N_TC')).toBe('1');
    expect(body.get('00N_SITE')).toBe('constructiveoperations.com');
    expect(body.get('00N_PAGE')).toBe('https://constructiveoperations.com/contact');
    expect(body.get('00N_CH')).toBe('Contact form');
    expect(body.get('lead_source')).toBe('Website');
  });

  it('dry-run sends nothing and returns the fields', async () => {
    stubSalesforce();
    vi.stubEnv('LEAD_MODE', 'dry-run');
    const res = await contact.POST(post('/api/contact', form));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((await res.json()).dryRun.last_name).toBe('Example');
  });

  it('honeypot: looks successful, sends nothing', async () => {
    stubSalesforce();
    const res = await contact.POST(post('/api/contact', { ...form, company_website: 'spam' }));
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns field errors', async () => {
    stubSalesforce();
    const res = await contact.POST(post('/api/contact', { name: '', email: 'x' }));
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).errors)).toContain('name');
  });

  it('refuses posts from other websites', async () => {
    stubSalesforce();
    expect((await contact.POST(post('/api/contact', form, { origin: 'https://evil.example' }))).status).toBe(403);
  });

  it('rate limits after 5 an hour', async () => {
    stubSalesforce();
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await contact.POST(post('/api/contact', form))).status);
    expect(codes).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it('reports a Salesforce outage', async () => {
    stubSalesforce();
    fetchSpy.mockImplementationOnce(async () => new Response('', { status: 503 }));
    expect((await contact.POST(post('/api/contact', form))).status).toBe(502);
  });
});

const text = (t: string) => ({ type: 'text', text: t });
const reply = (content: unknown[], stop = 'end_turn') => ({
  model: 'claude-sonnet-5-5',
  stop_reason: stop,
  content,
  usage: { input_tokens: 10, output_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
});
const conv = (...contents: string[]) => ({
  conversationId: 'conv-test-0001',
  page: 'https://constructiveoperations.com/',
  messages: contents.map((c, i) => ({ role: i % 2 ? 'assistant' : 'user', content: c })),
});

describe('/api/chat', () => {
  beforeEach(() => {
    vi.stubEnv('CHAT_ENABLED', 'true');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  });

  it('kill switch: CHAT_ENABLED must be "true"', async () => {
    vi.stubEnv('CHAT_ENABLED', 'false');
    const res = await chat.POST(post('/api/chat', conv('hi')));
    expect(res.status).toBe(503);
    expect((await res.json()).disabled).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses on Vercel when Redis is not connected', async () => {
    vi.stubEnv('VERCEL', '1');
    expect((await chat.POST(post('/api/chat', conv('hi')))).status).toBe(503);
  });

  it('uses Sonnet 5.5 by default with low effort, caching and the backup model', async () => {
    create.mockResolvedValueOnce(reply([text('We handle permitting in any jurisdiction.')]));
    const res = await chat.POST(post('/api/chat', conv('Do you do permits?')));
    expect((await res.json()).reply).toBe('We handle permitting in any jurisdiction.');
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-sonnet-5-5');
    expect(req.output_config).toEqual({ effort: 'low' });
    expect(req.max_tokens).toBe(1024);
    expect(req.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(req.fallbacks).toBe('default');
    expect(req.betas).toEqual(['server-side-fallback-2026-07-01']);
  });

  it('CHAT_MODEL switches the model; Haiku gets no backup model', async () => {
    vi.stubEnv('CHAT_MODEL', 'claude-haiku-5-5');
    create.mockResolvedValueOnce(reply([text('Hello.')]));
    await chat.POST(post('/api/chat', conv('hi')));
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('claude-haiku-5-5');
    expect(req.fallbacks).toBeUndefined();
  });

  it('filters every reply, including prices', async () => {
    create.mockResolvedValueOnce(reply([text('It is $650 per project.')]));
    const body = await (await chat.POST(post('/api/chat', conv('How much?')))).json();
    expect(body.reply).not.toContain('650');
    expect(body.debug.filtered).toBe('price');
  });

  it('applies the private block list (DENY_TERMS)', async () => {
    vi.stubEnv('DENY_TERMS', 'hidden-portal.example.net, Acme Roofing');
    create.mockResolvedValueOnce(reply([text('Sure, go to hidden-portal.example.net')]));
    const body = await (await chat.POST(post('/api/chat', conv('link?')))).json();
    expect(body.reply).not.toContain('hidden-portal');
  });

  it('a refusal becomes the safe answer', async () => {
    create.mockResolvedValueOnce(reply([], 'refusal'));
    const body = await (await chat.POST(post('/api/chat', conv('something odd')))).json();
    expect(body.reply).toContain(siteFacts.bookingUrl);
  });

  it('creates one chat lead, never with text consent, from details the visitor typed', async () => {
    stubSalesforce();
    const toolUse = {
      type: 'tool_use',
      id: 'tu_1',
      name: 'create_lead',
      input: { name: 'Pat Example', email: 'pat@example.com', phone: '', company: '', summary: 'Wants permitting help.' },
    };
    create.mockResolvedValueOnce(reply([toolUse], 'tool_use')).mockResolvedValueOnce(reply([text('Thanks, the team will be in touch.')]));
    const c = conv('Please have someone call me.', 'Sure, your name and email or phone?', "I'm Pat Example, pat@example.com. Yes please.");
    const body = await (await chat.POST(post('/api/chat', c))).json();
    expect(body.leadCreated).toBe(true);
    const sent = new URLSearchParams(String((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(sent.get('00N_CH')).toBe('Chat assistant');
    expect(sent.get('00N_TC')).toBeNull();
    expect(sent.get('00N_TEST')).toBe('1');
    expect(sent.get('description')).toContain('Wants permitting help.');
    const second = create.mock.calls[1][0];
    expect(second.messages.at(-1).content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'tu_1' });
  });

  it('refuses a lead with details the visitor never typed', async () => {
    stubSalesforce();
    const toolUse = {
      type: 'tool_use',
      id: 'tu_1',
      name: 'create_lead',
      input: { name: 'Pat Example', email: 'invented@example.com', phone: '', company: '', summary: 'x' },
    };
    create.mockResolvedValueOnce(reply([toolUse], 'tool_use')).mockResolvedValueOnce(reply([text('Could you share your email?')]));
    const body = await (await chat.POST(post('/api/chat', conv('I am Pat Example, call me')))).json();
    expect(body.leadCreated).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caps messages per conversation', async () => {
    create.mockResolvedValue(reply([text('ok')]));
    let last: { limit?: string } = {};
    for (let i = 0; i < 13; i++) last = await (await chat.POST(post('/api/chat', conv('hi')))).json();
    expect(last.limit).toBe('conversation');
    expect(create).toHaveBeenCalledTimes(12);
  });
});
