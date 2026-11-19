// Server-side checks on every chat reply before the visitor sees it, whichever
// model (main or backup) wrote it. Also used by the knowledge build to refuse
// a fact sheet that contains a price. Keep this file free of imports so
// scripts/build-chat-knowledge.mjs can load it directly.

/** Phrases that suggest access to the demo portal. Same spirit as scripts/check-clean.mjs. */
export const BUILT_IN_DENY: RegExp[] = [
  /try the demo/i,
  /demo login/i,
  /log ?in to (the )?demo/i,
  /free trial/i,
  /sandbox account/i,
  /\bdemo (portal|environment|account|instance|site|credentials|access|server)\b/i,
];

/** Anything that reads as a price or rate. */
export const PRICE_PATTERNS: RegExp[] = [
  /[$€£]\s?\d/,
  /\b\d[\d,]*(?:\.\d+)?\s?k?\s?(?:dollars|usd|bucks|cents)\b/i,
  /\busd\s?\d/i,
  /\b\d[\d,]*(?:\.\d+)?\s?k?\s?(?:per|\/)\s?(?:project|install|installation|job|permit|design|month|mo|year|yr|user|seat|hour|hr|kw|watt)\b/i,
];

export function hasPrice(text: string): boolean {
  return PRICE_PATTERNS.some((re) => re.test(text));
}

export type FilterOptions = {
  /** Lower-cased private block-list terms (DENY_TERMS). */
  denyTerms: string[];
  bookingUrl: string;
  /** Hosts a reply may link to. */
  allowedHosts: string[];
  maxChars?: number;
};

export type FilterResult = { text: string; changed: boolean; reason?: 'deny' | 'price' | 'link' | 'length' };

export function safeReply(kind: 'price' | 'general', bookingUrl: string): string {
  return kind === 'price'
    ? `We don't quote prices in chat, because pricing depends on your projects. Our team will go through it with you: you can book a 30-minute demo at ${bookingUrl} or leave your name and a phone number or email and we'll get back to you.`
    : `I can't help with that here, but our team can. You can book a 30-minute demo at ${bookingUrl} or leave your name and a phone number or email and someone will get back to you.`;
}

const FULL_URL_RE = /https?:\/\/[^\s<>"'()\]]+/gi;
const EMAIL_RE =/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URLISH_RE = /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s<>()"'\]]*)?/gi;

function linkAllowed(raw: string, opts: FilterOptions): boolean {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  if (opts.allowedHosts.includes(host)) return true;
  return withScheme.replace(/[.,;:!?]+$/, '').startsWith(opts.bookingUrl);
}

export function filterReply(input: string, opts: FilterOptions): FilterResult {
  const text = input.trim();
  const lower = text.toLowerCase();

  if (opts.denyTerms.some((t) => lower.includes(t)) || BUILT_IN_DENY.some((re) => re.test(text))) {
    return { text: safeReply('general', opts.bookingUrl), changed: true, reason: 'deny' };
  }
  if (hasPrice(text)) {
    return { text: safeReply('price', opts.bookingUrl), changed: true, reason: 'price' };
  }

  // Remove links to anywhere but our own sites and the booking page.
  // Full addresses (https://…) are checked first, because the booking address
  // itself contains an "@". Email addresses are then left alone (the visitor's
  // own address may be echoed back), and bare domains are checked last.
  let linkRemoved = false;
  const kept: string[] = [];
  const hold = (s: string) => {
    kept.push(s);
    return `\u0000${kept.length - 1}\u0000`;
  };
  const check = (m: string) => {
    if (linkAllowed(m, opts)) return hold(m);
    linkRemoved = true;
    return '[link removed]';
  };
  let out = text
    .replace(FULL_URL_RE, check)
    .replace(EMAIL_RE, hold)
    .replace(URLISH_RE, check);
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)]);

  const max = opts.maxChars ?? 1200;
  let cut = false;
  if (out.length > max) {
    const slice = out.slice(0, max);
    const end = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
    out = (end > max * 0.5 ? slice.slice(0, end + 1) : slice.trimEnd() + '…').trim();
    cut = true;
  }

  if (linkRemoved) return { text: out, changed: true, reason: 'link' };
  if (cut) return { text: out, changed: true, reason: 'length' };
  return { text: out, changed: false };
}
