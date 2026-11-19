// Salesforce Web-to-Lead. Both the contact form and the chat assistant create
// leads through sendLead(). No Salesforce login is involved: Web-to-Lead only
// needs the organisation ID and the custom field codes (config.ts).

import type { LeadMode, SalesforceConfig } from './config.js';

export type Channel = 'Contact form' | 'Chat assistant';

export type Lead = {
  name: string;
  company: string;
  email: string;
  phone: string;
  description: string;
  textConsent: boolean;
  site: string;
  page: string;
  channel: Channel;
};

export type SendResult =
  | { ok: true; sent: boolean; mode: LeadMode; fields: Record<string, string> }
  | { ok: false; mode: LeadMode; error: string };

/** Salesforce requires Last Name. A one-word name goes into Last Name. */
export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: '', last: parts[0] ?? '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/** The form fields posted to Salesforce. */
export function webToLeadFields(lead: Lead, cfg: SalesforceConfig, mode: LeadMode): Record<string, string> {
  const { first, last } = splitName(lead.name);
  const test = mode !== 'live';
  const description = `${test ? '[TEST] ' : ''}${lead.description}`.slice(0, 4000);
  const f: Record<string, string> = {
    oid: cfg.orgId,
    first_name: first.slice(0, 40),
    last_name: last.slice(0, 80),
    company: (lead.company.trim() || 'Not provided').slice(0, 255),
    email: lead.email.slice(0, 80),
    phone: lead.phone.slice(0, 40),
    description,
    lead_source: 'Website',
    [cfg.fields.site]: lead.site.slice(0, 80),
    [cfg.fields.page]: lead.page.slice(0, 255),
    [cfg.fields.channel]: lead.channel,
  };
  // Checkboxes: "1" ticks them; leaving them out leaves them unticked.
  if (lead.textConsent) f[cfg.fields.textConsent] = '1';
  if (test) f[cfg.fields.test] = '1';
  if (cfg.debugEmail) {
    f.debug = '1';
    f.debugEmail = cfg.debugEmail;
  }
  for (const k of Object.keys(f)) if (f[k] === '') delete f[k];
  return f;
}

/**
 * Sends the lead. Web-to-Lead answers "OK" even when it quietly rejects a
 * lead, so only network failures and server errors can be caught here.
 */
export async function sendLead(
  lead: Lead,
  cfg: SalesforceConfig,
  mode: LeadMode,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  const fields = webToLeadFields(lead, cfg, mode);
  if (mode === 'dry-run') return { ok: true, sent: false, mode, fields };
  try {
    const res = await fetchImpl(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status >= 400) return { ok: false, mode, error: `Salesforce answered ${res.status}` };
    return { ok: true, sent: true, mode, fields };
  } catch (e) {
    return { ok: false, mode, error: e instanceof Error ? e.name : 'network error' };
  }
}
