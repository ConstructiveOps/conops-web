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
  'mt-1 block w-full rounded-md border border-brand-gray px-3 py-2 text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30';

export default function ContactForm({ endpoint, isDev, email, bookingUrl }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const id = useId();
  const connected = endpoint.trim().length > 0;

  if (!connected && !isDev) {
    return (
      <div className="rounded-md border border-brand-gray/60 bg-surface-alt p-6">
        <p className="font-heading font-semibold text-navy">The contact form is coming soon.</p>
        <p className="mt-2 text-ink-muted">
          Email us at{' '}
          <a className="text-navy underline" href={`mailto:${email}`}>
            {email}
          </a>{' '}
          or{' '}
          <a className="text-navy underline" href={bookingUrl} target="_blank" rel="noopener">
            book a demo
          </a>
          .
        </p>
      </div>
    );
  }

  const onSubmit: ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault();
    if (!connected) return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (data.company_website) return; // honeypot: bots fill hidden fields
    delete data.company_website;
    setStatus('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: window.location.href }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-md border border-navy/30 bg-surface-alt p-6">
        <p className="font-heading font-semibold text-navy">Thanks — we'll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false} className="space-y-4" aria-describedby={`${id}-status`}>
      {!connected && (
        <p className="placeholder p-3 text-sm">
          <span className="placeholder-badge">Not connected yet</span>
          This form has no submit address. Set <code>contactFormEndpoint</code> in{' '}
          <code>src/data/site.ts</code>. (Shown in development only.)
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Name <span aria-hidden="true">*</span>
          <input className={field} name="name" autoComplete="name" required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Company
          <input className={field} name="company" autoComplete="organization" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email <span aria-hidden="true">*</span>
          <input className={field} name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Phone
          <input className={field} name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Message <span aria-hidden="true">*</span>
        <textarea className={`${field} min-h-32`} name="message" required rows={5} />
      </label>

      {/* Honeypot — hidden from people and screen readers. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Leave this empty
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="text-xs text-ink-muted">* required</p>

      <button
        type="submit"
        disabled={!connected || status === 'sending'}
        className="inline-flex items-center justify-center rounded-md bg-navy px-5 py-3 font-heading text-sm font-semibold text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send'}
      </button>

      <p id={`${id}-status`} role="status" aria-live="polite" className="text-sm text-red-700 min-h-5">
        {status === 'error' ? `Something went wrong. Please email ${email}.` : ''}
      </p>
    </form>
  );
}
