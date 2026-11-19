import { afterEach, describe, expect, it, vi } from 'vitest';
import { leadMode, salesforceConfig, type SalesforceConfig } from '../api/_lib/config';
import { sendLead, splitName, webToLeadFields, type Lead } from '../api/_lib/leads';

const cfg: SalesforceConfig = {
  orgId: '00D000000000001',
  url: 'https://webto.example.com/servlet',
  fields: { textConsent: '00N_TC', site: '00N_SITE', page: '00N_PAGE', channel: '00N_CH', test: '00N_TEST' },
};

const lead: Lead = {
  name: 'Pat Example',
  company: '',
  email: 'pat@example.com',
  phone: '',
  description: 'Interested in permitting help.',
  textConsent: true,
  site: 'constructiveoperations.com',
  page: 'https://constructiveoperations.com/contact',
  channel: 'Contact form',
};

afterEach(() => vi.unstubAllEnvs());

describe('splitName', () => {
  it('puts a one-word name in Last Name', () => expect(splitName('Cher')).toEqual({ first: '', last: 'Cher' }));
  it('splits first word from the rest', () => expect(splitName('  Mary  Ann Smith ')).toEqual({ first: 'Mary', last: 'Ann Smith' }));
});

describe('leadMode: live only when LEAD_MODE=live AND site.launched', () => {
  it('live + launched → live', () => {
    vi.stubEnv('LEAD_MODE', 'live');
    expect(leadMode(true)).toBe('live');
  });
  it('live + not launched → test', () => {
    vi.stubEnv('LEAD_MODE', 'live');
    expect(leadMode(false)).toBe('test');
  });
  it('missing or unknown → test', () => {
    vi.stubEnv('LEAD_MODE', '');
    expect(leadMode(true)).toBe('test');
    vi.stubEnv('LEAD_MODE', 'LIVE!');
    expect(leadMode(true)).toBe('test');
  });
  it('dry-run → dry-run', () => {
    vi.stubEnv('LEAD_MODE', 'dry-run');
    expect(leadMode(true)).toBe('dry-run');
  });
});

describe('salesforceConfig', () => {
  it('is null when the org ID or any field code is missing', () => {
    vi.stubEnv('SF_ORG_ID', 'x');
    vi.stubEnv('SF_FIELD_TEXT_CONSENT', 'a');
    vi.stubEnv('SF_FIELD_SITE', 'b');
    vi.stubEnv('SF_FIELD_PAGE', 'c');
    vi.stubEnv('SF_FIELD_CHANNEL', 'd');
    vi.stubEnv('SF_FIELD_TEST', '');
    expect(salesforceConfig()).toBeNull();
    vi.stubEnv('SF_FIELD_TEST', 'e');
    expect(salesforceConfig()?.fields.test).toBe('e');
  });
});

describe('webToLeadFields', () => {
  it('marks test leads: test box ticked and [TEST] in Description', () => {
    const f = webToLeadFields(lead, cfg, 'test');
    expect(f['00N_TEST']).toBe('1');
    expect(f.description.startsWith('[TEST] ')).toBe(true);
  });
  it('live leads have no test marks', () => {
    const f = webToLeadFields(lead, cfg, 'live');
    expect(f['00N_TEST']).toBeUndefined();
    expect(f.description).toBe(lead.description);
  });
  it('maps the standard and custom fields', () => {
    const f = webToLeadFields(lead, cfg, 'live');
    expect(f).toMatchObject({
      oid: cfg.orgId,
      first_name: 'Pat',
      last_name: 'Example',
      company: 'Not provided',
      email: 'pat@example.com',
      lead_source: 'Website',
      '00N_SITE': 'constructiveoperations.com',
      '00N_PAGE': 'https://constructiveoperations.com/contact',
      '00N_CH': 'Contact form',
      '00N_TC': '1',
    });
    expect(f.phone).toBeUndefined();
  });
  it('leaves Text Consent unticked when not given', () => {
    expect(webToLeadFields({ ...lead, textConsent: false }, cfg, 'live')['00N_TC']).toBeUndefined();
  });
  it('adds the Salesforce debug email only when set', () => {
    expect(webToLeadFields(lead, { ...cfg, debugEmail: 'me@example.com' }, 'test')).toMatchObject({ debug: '1', debugEmail: 'me@example.com' });
  });
});

describe('sendLead', () => {
  it('dry-run sends nothing', async () => {
    const f = vi.fn();
    const r = await sendLead(lead, cfg, 'dry-run', f as unknown as typeof fetch);
    expect(f).not.toHaveBeenCalled();
    expect(r).toMatchObject({ ok: true, sent: false });
  });
  it('posts form-encoded fields to the Web-to-Lead address', async () => {
    const f = vi.fn(async () => new Response('', { status: 200 }));
    const r = await sendLead(lead, cfg, 'test', f as unknown as typeof fetch);
    expect(r.ok).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(cfg.url);
    const body = new URLSearchParams(String(init.body));
    expect(body.get('oid')).toBe(cfg.orgId);
    expect(body.get('00N_TEST')).toBe('1');
  });
  it('reports server errors and network failures', async () => {
    const bad = vi.fn(async () => new Response('', { status: 500 }));
    expect((await sendLead(lead, cfg, 'live', bad as unknown as typeof fetch)).ok).toBe(false);
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect((await sendLead(lead, cfg, 'live', down as unknown as typeof fetch)).ok).toBe(false);
  });
});
