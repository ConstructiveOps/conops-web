// Checks on what visitors send. Everything from the browser is untrusted.

export type ContactInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  smsConsent: boolean;
  page: unknown;
  /** Honeypot: hidden from people, bots fill it in. */
  honeypot: boolean;
};

export type Checked<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const EMAIL_OK = /^[^\s@<>()"]+@[^\s@<>()"]+\.[A-Za-z]{2,}$/;

function str(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\u0000/g, '').trim() : '';
}

export function validEmail(v: string): boolean {
  return v.length <= 80 && EMAIL_OK.test(v);
}

/** 10 to 15 digits, ignoring spaces, dashes, dots, brackets and a leading +. */
export function validPhone(v: string): boolean {
  if (v.length > 40 || /[^\d\s().+-]/.test(v)) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function validateContact(body: unknown): Checked<ContactInput> {
  if (!body || typeof body !== 'object') return { ok: false, errors: { form: 'Something was missing. Please try again.' } };
  const b = body as Record<string, unknown>;
  const value: ContactInput = {
    name: str(b.name),
    company: str(b.company),
    email: str(b.email),
    phone: str(b.phone),
    message: str(b.message),
    smsConsent: b.smsConsent === true,
    page: b.page,
    honeypot: str(b.company_website).length > 0,
  };
  const errors: Record<string, string> = {};
  if (!value.name) errors.name = 'Please enter your name.';
  else if (value.name.length > 120) errors.name = 'Please shorten your name.';
  if (value.company.length > 120) errors.company = 'Please shorten the company name.';
  if (value.email && !validEmail(value.email)) errors.email = 'Please check your email address.';
  if (value.phone && !validPhone(value.phone)) errors.phone = 'Please check your phone number.';
  if (!value.email && !value.phone) errors.email = 'Please give an email address or a phone number.';
  if (!value.message) errors.message = 'Please tell us how we can help.';
  else if (value.message.length > 4000) errors.message = 'Please shorten your message (4,000 characters at most).';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type ChatInput = { conversationId: string; page: unknown; messages: ChatTurn[] };

/**
 * The browser sends the whole conversation each time (the server keeps none).
 * It must start and end with the visitor, alternate, and stay within the caps.
 */
export function validateChat(body: unknown, maxUserMessages: number, maxChars: number): Checked<ChatInput> {
  const bad = (m: string): Checked<ChatInput> => ({ ok: false, errors: { chat: m } });
  if (!body || typeof body !== 'object') return bad('invalid request');
  const b = body as Record<string, unknown>;
  const conversationId = str(b.conversationId);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(conversationId)) return bad('invalid conversation id');
  if (!Array.isArray(b.messages) || b.messages.length === 0) return bad('no messages');
  if (b.messages.length > maxUserMessages * 2) return bad('too many messages');
  const messages: ChatTurn[] = [];
  for (const [i, m] of (b.messages as unknown[]).entries()) {
    if (!m || typeof m !== 'object') return bad('invalid message');
    const role = (m as Record<string, unknown>).role;
    const content = str((m as Record<string, unknown>).content);
    const expected = i % 2 === 0 ? 'user' : 'assistant';
    if (role !== expected) return bad('messages out of order');
    if (!content) return bad('empty message');
    if (content.length > (role === 'user' ? maxChars : 2000)) return bad('message too long');
    messages.push({ role: expected, content });
  }
  if (messages[messages.length - 1].role !== 'user') return bad('last message must be the visitor');
  return { ok: true, value: { conversationId, page: b.page, messages } };
}
