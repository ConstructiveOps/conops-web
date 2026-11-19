// Settings read from environment variables (Vercel → Settings → Environment
// Variables; locally .env.local). Real values never go in the repo.
// Names and meanings: .env.example.

export type LeadMode = 'live' | 'test' | 'dry-run';

export type SalesforceConfig = {
  orgId: string;
  url: string;
  debugEmail?: string;
  fields: {
    textConsent: string;
    site: string;
    page: string;
    channel: string;
    test: string;
  };
};

const DEFAULT_WEB_TO_LEAD_URL = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8';

export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/**
 * Salesforce Web-to-Lead settings, or null when any required value is missing.
 * Null means "not connected": the contact form shows its email / book-a-demo
 * fallback and the chat offers those instead of taking details.
 */
export function salesforceConfig(): SalesforceConfig | null {
  const orgId = env('SF_ORG_ID');
  const fields = {
    textConsent: env('SF_FIELD_TEXT_CONSENT'),
    site: env('SF_FIELD_SITE'),
    page: env('SF_FIELD_PAGE'),
    channel: env('SF_FIELD_CHANNEL'),
    test: env('SF_FIELD_TEST'),
  };
  if (!orgId || Object.values(fields).some((v) => !v)) return null;
  return {
    orgId,
    url: env('SF_WEB_TO_LEAD_URL') ?? DEFAULT_WEB_TO_LEAD_URL,
    debugEmail: env('SF_DEBUG_EMAIL'),
    fields: fields as SalesforceConfig['fields'],
  };
}

/**
 * A lead is live ONLY when LEAD_MODE=live AND site.launched is true.
 * Every other case is a test lead (Website Test Lead ticked, "[TEST]" in the
 * Description, no alert email). LEAD_MODE=dry-run sends nothing at all.
 */
export function leadMode(launched: boolean): LeadMode {
  const m = env('LEAD_MODE')?.toLowerCase();
  if (m === 'dry-run') return 'dry-run';
  if (m === 'live' && launched) return 'live';
  return 'test';
}

/** True on Vercel (preview or production), false on a developer's machine. */
export function onVercel(): boolean {
  return process.env.VERCEL === '1';
}

/** True only for the Production environment on Vercel. */
export function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/** Comma-separated private block list (DENY_TERMS), lower-cased. */
export function denyTerms(): string[] {
  return (env('DENY_TERMS') ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 3);
}
