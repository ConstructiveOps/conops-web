import { describe, expect, it } from 'vitest';
import { filterReply, hasPrice } from '../api/_lib/filter';

const bookingUrl = 'https://outlook.office365.com/owa/calendar/Example@example.com/bookings/s/abc';
const opts = {
  denyTerms: ['secret-portal.example.net', 'acme roofing'],
  bookingUrl,
  allowedHosts: ['constructiveoperations.com', 'www.constructiveoperations.com', 'sundialcrm.com', 'www.sundialcrm.com'],
};

describe('prices', () => {
  it.each([
    'It costs $800 per project.',
    'About 800 dollars.',
    'Roughly 1.5k USD.',
    'USD 900',
    'We charge 500 per project',
    '20/month per seat',
    '€300',
  ])('catches "%s"', (t) => {
    expect(hasPrice(t)).toBe(true);
    expect(filterReply(t, opts)).toMatchObject({ changed: true, reason: 'price' });
  });
  it.each(['Designs in less than 48 hours.', '40+ years of experience', '10,000+ projects', '15 steps handled by our team. 5 by yours.', 'Flat rate per project'])(
    'leaves "%s" alone',
    (t) => expect(hasPrice(t)).toBe(false),
  );
});

describe('block list and demo-portal phrases', () => {
  it.each([
    'You can log in at secret-portal.example.net',
    'We work with ACME Roofing.',
    'Try the demo yourself!',
    'Here is the demo login.',
    'Ask for a free trial.',
    'I can send demo credentials.',
  ])('replaces "%s"', (t) => {
    const r = filterReply(t, opts);
    expect(r.reason).toBe('deny');
    expect(r.text).toContain(bookingUrl);
  });
  it('allows "book a demo"', () => expect(filterReply('You can book a demo with our team.', opts).changed).toBe(false));
});

describe('links', () => {
  it('keeps our sites and the booking link', () => {
    const t = `See https://sundialcrm.com/#features or constructiveoperations.com/services, or book at ${bookingUrl}.`;
    expect(filterReply(t, opts)).toEqual({ text: t, changed: false });
  });
  it('removes other sites, including other subdomains', () => {
    const r = filterReply('Log in at https://portal.constructiveoperations.com/home or see example.org.', opts);
    expect(r.reason).toBe('link');
    expect(r.text).not.toContain('portal.');
    expect(r.text).not.toContain('example.org');
  });
  it('leaves email addresses alone', () => {
    const t = "Thanks, we'll reach you at pat@gmail.com or you can write to info@constructiveoperations.com.";
    expect(filterReply(t, opts).changed).toBe(false);
  });
});

describe('length', () => {
  it('cuts long replies at a sentence end', () => {
    const t = 'This is a sentence. '.repeat(100);
    const r = filterReply(t, opts);
    expect(r.reason).toBe('length');
    expect(r.text.length).toBeLessThanOrEqual(1200);
    expect(r.text.endsWith('.')).toBe(true);
  });
});
