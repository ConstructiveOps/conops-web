// Contact form (React island). Posts JSON to the address in
// src/data/site.ts → contactFormEndpoint. While that is empty the form is
// "not connected": development shows a clear notice; production shows a
// fallback (email / book a demo) instead of a form that would go nowhere.
import { useId, useState, type ComponentProps } from 'react';

type Props = {
  endpoint: string;
  isDev: boolean;
  email: string;
  bookingUrl: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

const field =
  'block w-full rounded border border-[#7b8186] bg-white px-3.5 py-3 text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30';
const labelCls = 'text-sm font-semibold text-ink-soft';

export default function ContactForm({ endpoint, isDev, email, bookingUrl }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const id = useId();
  const connected = endpoint.trim().length > 0;

  if (!connected && !isDev) {
    return (
      <div className="rounded border border-line-strong bg-white p-6">
        <p className="font-display text-lg text-navy">The contact form is coming soon.</p>
        <p className="mt-2 text-ink-soft">
          Email us at{' '}
          <a className="text-navy underline" href={`mailto:${email}`}>
            {email}
          </a>{' '}
          or{' '}
          <a className="text-navy underline" href={bookingUrl} target="_blank" rel="noopener">
            pick a time for a demo
          </a>
          .
        </p>
      </div>
    );
  }

  const onSubmit: ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault();
    if (!connected) return;
    const form = new FormData(e.currentTarget);
    if (form.get('company_website')) return; // honeypot: bots fill hidden fields
    const data = {
      name: form.get('name'),
      company: form.get('company'),
      email: form.get('email'),
      phone: form.get('phone'),
      message: form.get('message'),
      smsConsent: form.get('sms_consent') === 'yes',
      source: window.location.href,
    };
    setStatus('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div role="status" className="rounded border border-navy/30 bg-white p-6">
        <p className="font-display text-lg text-navy">Thanks, we'll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" aria-describedby={`${id}-status`}>
      {!connected && (
        <p className="placeholder p-3 text-sm">
          <span className="placeholder-badge">Not connected yet</span>
          This form has no submit address. Set <code>contactFormEndpoint</code> in{' '}
          <code>src/data/site.ts</code>. (Shown in development only.)
        </p>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className={labelCls}>Name</label>
          <input id={`${id}-name`} className={field} name="name" autoComplete="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-company`} className={labelCls}>Company</label>
          <input id={`${id}-company`} className={field} name="company" autoComplete="organization" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className={labelCls}>Email</label>
          <input id={`${id}-email`} className={field} name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-phone`} className={labelCls}>Phone</label>
          <input id={`${id}-phone`} className={field} name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-msg`} className={labelCls}>How can we help?</label>
        <textarea id={`${id}-msg`} className={`${field} resize-y`} name="message" required rows={4} />
      </div>

      <div className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input id={`${id}-sms`} name="sms_consent" value="yes" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-navy" />
        <label htmlFor={`${id}-sms`}>It's OK to text me about this request. Reply STOP to opt out.</label>
      </div>

      {/* Honeypot — hidden from people and screen readers. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Leave this empty
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3.5">
        <button
          type="submit"
          disabled={!connected || status === 'sending'}
          className="font-display rounded bg-navy px-[26px] py-[15px] text-base text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <a href={bookingUrl} target="_blank" rel="noopener" className="font-display text-base text-navy underline-offset-4 hover:underline">
          or pick a time for a demo
        </a>
      </div>

      <p id={`${id}-status`} role="status" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {status === 'error' ? `Something went wrong. Please email ${email}.` : ''}
      </p>
    </form>
  );
}
