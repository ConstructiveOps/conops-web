// Small request/response helpers shared by the /api functions.

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

/** Visitor's address as Vercel reports it. Only ever stored scrambled (limits.ts). */
export function clientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-real-ip') ??
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export function requestHost(request: Request): string {
  const raw = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
  return raw.toLowerCase().replace(/:\d+$/, '');
}

/**
 * Browsers send Origin on cross-site POSTs. Refuse posts from other websites
 * so nobody can use these endpoints from their own pages.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host.toLowerCase().replace(/:\d+$/, '') === requestHost(request);
  } catch {
    return false;
  }
}

/** Reads a JSON body up to maxChars; null if missing, too large or not JSON. */
export async function readJson(request: Request, maxChars = 40_000): Promise<unknown | null> {
  const text = await request.text();
  if (!text || text.length > maxChars) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Which site the visitor was on. The real domains come from the address the
 * request arrived on (not from anything the browser claims). On preview and
 * local addresses it is worked out from the page path and marked "(preview)".
 */
export function siteFor(host: string, page: string): string {
  const h = host.replace(/^www\./, '');
  if (h === 'sundialcrm.com' || h === 'constructiveoperations.com') return h;
  let path = '';
  try {
    path = new URL(page).pathname;
  } catch {
    /* no page */
  }
  const guess = path === '/sundial' || path.startsWith('/sundial/') ? 'sundialcrm.com' : 'constructiveoperations.com';
  return `${guess} (preview)`;
}

/** The page address without query string or #fragment (they can hold personal data). */
export function cleanPage(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2000) return '';
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    return `${u.origin}${u.pathname}`.slice(0, 255);
  } catch {
    return '';
  }
}
