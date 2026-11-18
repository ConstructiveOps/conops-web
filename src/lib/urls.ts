import { site } from '../data/site';

/**
 * Pages are built ahead of time, so they cannot tell which domain a visitor
 * is on. Sundial pages therefore link with full addresses.
 *
 * sundialUrl('/') -> https://sundialcrm.com/
 * In development (npm run dev) it returns the local /sundial path instead,
 * so links work on your machine.
 */
export function sundialUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (import.meta.env.DEV) return clean === '/' ? '/sundial' : `/sundial${clean}`;
  return `${site.domains.sundial}${clean}`;
}

/** Full address of a Constructive Operations page (used from Sundial pages). */
export function coUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (import.meta.env.DEV) return clean;
  return `${site.domains.co}${clean}`;
}

/**
 * Link for a nav item. `from` is the site the current page belongs to:
 * links within the same Constructive Operations site stay relative;
 * everything else is a full address.
 */
export function navHref(item: { site: 'co' | 'sundial'; path: string }, from: 'co' | 'sundial'): string {
  if (item.site === 'sundial') return sundialUrl(item.path);
  return from === 'co' ? item.path : coUrl(item.path);
}

/**
 * Canonical address for the current page. Sundial pages (/sundial/...) are
 * canonical on sundialcrm.com without the /sundial prefix.
 */
export function canonicalFor(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/sundial' || p.startsWith('/sundial/')) {
    const rest = p.slice('/sundial'.length) || '/';
    return `${site.domains.sundial}${rest === "/" ? "/" : `${rest}/`}`;
  }
  return `${site.domains.co}${p === "/" ? "/" : `${p}/`}`;
}
