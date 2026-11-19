// Contact form (React island). Posts JSON to src/data/site.ts → contactFormEndpoint
// (api/contact.ts → Salesforce Web-to-Lead). On load it asks the endpoint
// whether it is connected. If not (Salesforce settings missing, or `npm run
// dev`, which has no functions), development shows a clear notice and
// production shows the email / book-a-demo fallback instead of a dead form.
import { useEffect, useId, useState, type ComponentProps } from 'react';

type Props = {
  endpoint: string;
  isDev: boolean;
  email: string;
  phone: string;
  bookingUrl: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate';
type Connection = 'checking' | 'yes' | 'no';

const field =
  'block w-full rounded border border-[#7b8186] bg-white px-3.5 py-3 text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30 aria-[invalid=true]:border-red-700';
const labelCls = 'text-sm font-semibold text-ink-soft';
const errCls = 'text-sm text-red-700';

export const SMS_CONSENT_LABEL =
  'Yes, Constructive Operations may text me about this request. Msg & data rates may apply. Reply STOP to opt out.';

export default function ContactForm({ endpoint, isDev, email, phone, bookingUrl }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [connection, setConnection] = useState<Connection>(endpoint ? 'checking' : 'no');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const id = useId();

  useEffect(() => {
    if (!endpoint) return;
    let live = true;
    fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : { connected: false }))
      .then((d: { connected?: boolean }) => live && setConnection(d.connected ? 'yes' : 'no'))
      .catch(() => live && setConnection('no'));
    return () => {
      live = false;
    };
  }, [endpoint]);

  const fallback = (
    <div className="rounded border border-line-strong bg-white p-6">
      <p className="text-lg font-medium text-navy">The contact form is coming soon.</p>
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

  if (connection === 'no' && !isDev) return fallback;

  const connected = connection === 'yes';

  const onSubmit: ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get('company_website')) {
      setStatus('sent'); // honeypot: bots fill hidden fields
      return;
    }
    if (!connected) return;
    const data = {
      name: form.get('name'),
      company: form.get('company'),
      email: form.get('email'),
      phone: form.get('phone'),
      message: form.get('message'),
      smsConsent: form.get('sms_consent') === 'yes',
      page: window.location.href,
      company_website: form.get('company_website'),
    };
    setStatus('sending');
    setErrors({});
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as { errors?: Record<string, string>; connected?: boolean };
      if (res.ok) return setStatus('sent');
      if (res.status === 400 && body.errors) {
        setErrors(body.errors);
        return setStatus('idle');
      }
      if (res.status === 503 && body.connected === false) return setConnection('no');
      setStatus(res.status === 429 ? 'rate' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div role="status" className="rounded border border-navy/30 bg-white p-6">
        <p className="text-lg font-medium text-navy">Thanks, we'll be in touch.</p>
        <p className="mt-2 text-ink-soft">
          Want to talk sooner?{' '}
          <a className="text-navy underline" href={bookingUrl} target="_blank" rel="noopener">
            Pick a time for a demo
          </a>
          .
        </p>
      </div>
    );
  }

  const errorText = (name: string) =>
    errors[name] ? (
      <p id={`${id}-${name}-err`} className={errCls}>
        {errors[name]}
      </p>
    ) : null;
  const invalid = (name: string) =>
    errors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-${name}-err` } : {};

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5" aria-describedby={`${id}-status`}>
      {!connected && isDev && connection === 'no' && (
        <p className="placeholder p-3 text-sm">
          <span className="placeholder-badge">Not connected yet</span>
          The form's address ({endpoint || 'none'}) is not answering as connected. With <code>npm run dev</code> there are no
          functions; on Vercel, add the Salesforce settings. (Shown in development only.)
        </p>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className={labelCls}>Name</label>
          <input id={`${id}-name`} className={field} name="name" autoComplete="name" required maxLength={120} {...invalid('name')} />
          {errorText('name')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-company`} className={labelCls}>Company</label>
          <input id={`${id}-company`} className={field} name="company" autoComplete="organization" maxLength={120} {...invalid('company')} />
          {errorText('company')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className={labelCls}>Email</label>
          <input id={`${id}-email`} className={field} name="email" type="email" autoComplete="email" maxLength={80} {...invalid('email')} />
          {errorText('email')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-phone`} className={labelCls}>Phone</label>
          <input id={`${id}-phone`} className={field} name="phone" type="tel" autoComplete="tel" maxLength={40} {...invalid('phone')} />
          {errorText('phone')}
        </div>
      </div>
      <p className="-mt-1.5 text-sm text-ink-muted">An email address or a phone number is enough.</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-msg`} className={labelCls}>How can we help?</label>
        <textarea id={`${id}-msg`} className={`${field} resize-y`} name="message" required rows={4} maxLength={4000} {...invalid('message')} />
        {errorText('message')}
      </div>

      <div className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input id={`${id}-sms`} name="sms_consent" value="yes" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-navy" />
        <label htmlFor={`${id}-sms`}>{SMS_CONSENT_LABEL}</label>
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
          className="rounded bg-navy px-[26px] font-medium py-[15px] text-base text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <a href={bookingUrl} target="_blank" rel="noopener" className="text-base font-medium text-navy underline-offset-4 hover:underline">
          or pick a time for a demo
        </a>
      </div>

      <p id={`${id}-status`} role="status" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {status === 'error' && (
          <>
            Sorry, your message didn't go through. Please try again, or email{' '}
            <a className="underline" href={`mailto:${email}`}>{email}</a>, call {phone}, or{' '}
            <a className="underline" href={bookingUrl} target="_blank" rel="noopener">book a demo</a>.
          </>
        )}
        {status === 'rate' && (
          <>
            You've sent several messages already. Please email{' '}
            <a className="underline" href={`mailto:${email}`}>{email}</a> or call {phone}.
          </>
        )}
        {Object.keys(errors).length > 0 && 'Please check the highlighted fields.'}
      </p>
    </form>
  );
}
