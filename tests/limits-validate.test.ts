import { describe, expect, it } from 'vitest';
import { cleanPage, siteFor } from '../api/_lib/http';
import { LIMITS, MemoryCounter, allowContact, chatLimitHit, claimChatLead, visitorId } from '../api/_lib/limits';
import { validPhone, validateChat, validateContact } from '../api/_lib/validate';

describe('limits', () => {
  it('contact form: 5 an hour', async () => {
    const c = new MemoryCounter();
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await allowContact(c, 'v1'));
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it('contact form: 10 a day', async () => {
    let now = 0;
    const c = new MemoryCounter(() => now);
    let allowed = 0;
    for (let hour = 0; hour < 3; hour++) {
      now = hour * 3600_000 + 1;
      for (let i = 0; i < 5; i++) if (await allowContact(c, 'v1')) allowed++;
    }
    expect(allowed).toBe(LIMITS.contactPerDay);
  });

  it('chat: 12 messages per conversation, then 40 per visitor per day', async () => {
    const c = new MemoryCounter();
    const hits = [];
    for (let i = 0; i < 13; i++) hits.push(await chatLimitHit(c, 'v1', 'conv-0001'));
    expect(hits.slice(0, 12).every((h) => h === null)).toBe(true);
    expect(hits[12]).toBe('conversation');
    let daily = null;
    for (let i = 0; i < 40 && !daily; i++) daily = await chatLimitHit(c, 'v1', `conv-${1000 + i}`);
    expect(daily).toBe('daily');
  });

  it('chat: site-wide cap', async () => {
    const c = new MemoryCounter();
    let hit = null;
    for (let i = 0; i <= LIMITS.chatSiteWidePerDay && !hit; i++) hit = await chatLimitHit(c, `v${i}`, `conv-${10000 + i}`);
    expect(hit).toBe('site');
  });

  it('one lead per conversation', async () => {
    const c = new MemoryCounter();
    expect(await claimChatLead(c, 'conv-0001')).toBe(true);
    expect(await claimChatLead(c, 'conv-0001')).toBe(false);
  });

  it('counters expire', async () => {
    let now = 0;
    const c = new MemoryCounter(() => now);
    await c.incr('k', 60);
    now = 61_000;
    expect(await c.incr('k', 60)).toBe(1);
  });

  it('visitor code is scrambled and changes daily', () => {
    const a = visitorId('203.0.113.9', new Date('2026-11-19T10:00:00Z'));
    expect(a).not.toContain('203');
    expect(visitorId('203.0.113.9', new Date('2026-11-19T23:00:00Z'))).toBe(a);
    expect(visitorId('203.0.113.9', new Date('2026-11-20T01:00:00Z'))).not.toBe(a);
  });
});

describe('contact validation', () => {
  const ok = { name: 'Pat Example', email: 'pat@example.com', message: 'Hello' };
  it('accepts name + email + message', () => expect(validateContact(ok).ok).toBe(true));
  it('accepts phone instead of email', () => expect(validateContact({ ...ok, email: '', phone: '(602) 555-0123' }).ok).toBe(true));
  it('needs email or phone', () => {
    const r = validateContact({ ...ok, email: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.email).toBeTruthy();
  });
  it('rejects a bad email, missing name and message', () => {
    const r = validateContact({ email: 'nope' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['email', 'message', 'name']);
  });
  it('only a real true counts as text consent', () => {
    const r = validateContact({ ...ok, smsConsent: 'yes' });
    expect(r.ok && r.value.smsConsent).toBe(false);
  });
  it('spots the honeypot', () => {
    const r = validateContact({ ...ok, company_website: 'http://spam.example' });
    expect(r.ok && r.value.honeypot).toBe(true);
  });
  it('phone numbers', () => {
    expect(validPhone('+1 602-555-0123')).toBe(true);
    expect(validPhone('555-0123')).toBe(false);
    expect(validPhone('call me 6025550123')).toBe(false);
  });
});

describe('chat validation', () => {
  const v = (body: unknown) => validateChat(body, 12, 1000);
  const msgs = (n: number) => Array.from({ length: n }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  it('accepts an alternating conversation ending with the visitor', () => expect(v({ conversationId: 'abcdef12', messages: msgs(3) }).ok).toBe(true));
  it('rejects a conversation ending with the assistant', () => expect(v({ conversationId: 'abcdef12', messages: msgs(2) }).ok).toBe(false));
  it('rejects more than 12 visitor messages', () => expect(v({ conversationId: 'abcdef12', messages: msgs(25) }).ok).toBe(false));
  it('rejects long messages and bad ids', () => {
    expect(v({ conversationId: 'abcdef12', messages: [{ role: 'user', content: 'x'.repeat(1001) }] }).ok).toBe(false);
    expect(v({ conversationId: '../../etc', messages: msgs(1) }).ok).toBe(false);
  });
});

describe('site and page', () => {
  it('uses the real domain when the request arrived on it', () => {
    expect(siteFor('www.sundialcrm.com', 'https://whatever.example/x')).toBe('sundialcrm.com');
    expect(siteFor('constructiveoperations.com', '')).toBe('constructiveoperations.com');
  });
  it('marks preview addresses', () => {
    expect(siteFor('conops-web-git-x.vercel.app', 'https://conops-web-git-x.vercel.app/sundial/')).toBe('sundialcrm.com (preview)');
    expect(siteFor('localhost', 'http://localhost:4321/contact')).toBe('constructiveoperations.com (preview)');
  });
  it('drops query strings and fragments from the page address', () => {
    expect(cleanPage('https://sundialcrm.com/?email=a@b.com#features')).toBe('https://sundialcrm.com/');
    expect(cleanPage('javascript:alert(1)')).toBe('');
  });
});
