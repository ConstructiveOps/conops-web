// Chat assistant panel. Loaded on demand by ChatWidget.astro the first time
// the visitor opens it. Talks to /api/chat. The conversation lives only in
// this browser tab (sessionStorage) and is gone when the tab closes.
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

export type ChatConfig = {
  brand: 'co' | 'sundial';
  title: string;
  endpoint: string;
  bookingUrl: string;
  email: string;
  phone: string;
  phoneHref: string;
};

type Msg = { role: 'user' | 'assistant'; content: string };
type Saved = { id: string; messages: Msg[]; ended: boolean };

const STORE = 'conops-chat-v1';
const OPEN_FLAG = 'conops-chat-open';
const MAX_USER_MESSAGES = 12;
const MAX_CHARS = 1000;

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function load(): Saved {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as Saved | null;
    if (s && typeof s.id === 'string' && Array.isArray(s.messages)) return s;
  } catch {
    /* storage blocked or bad data */
  }
  return { id: newId(), messages: [], ended: false };
}

function save(s: Saved) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* storage blocked */
  }
}

function setOpenFlag(open: boolean) {
  try {
    if (open) sessionStorage.setItem(OPEN_FLAG, '1');
    else sessionStorage.removeItem(OPEN_FLAG);
  } catch {
    /* storage blocked */
  }
}

/** Turns web addresses, email addresses and our phone number into links. */
function linkify(text: string, cfg: ChatConfig): ReactNode[] {
  const phone = cfg.phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(https?:\\/\\/[^\\s<>"']+[^\\s<>"'.,;:!?)])|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})|(${phone})`, 'g');
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const cls = 'underline underline-offset-2 break-all';
    if (m[1]) {
      const label = m[1] === cfg.bookingUrl ? 'Book a demo' : m[1].replace(/^https?:\/\//, '');
      out.push(<a key={i} className={cls} href={m[1]} target="_blank" rel="noopener">{label}</a>);
    } else if (m[2]) {
      out.push(<a key={i} className={cls} href={`mailto:${m[2]}`}>{m[2]}</a>);
    } else {
      out.push(<a key={i} className={cls} href={cfg.phoneHref}>{m[3]}</a>);
    }
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function ChatPanel({ cfg, launcher }: { cfg: ChatConfig; launcher: HTMLButtonElement }) {
  const [open, setOpen] = useState(true);
  const [state, setState] = useState<Saved>(load);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  const greeting =
    cfg.brand === 'sundial'
      ? 'Hi. Ask about Sundial or our back-office services, or I can find a time for a demo with our team.'
      : 'Hi. Ask about our services or Sundial, or I can find a time for a demo with our team.';

  const userCount = state.messages.filter((m) => m.role === 'user').length;
  const ended = state.ended || userCount >= MAX_USER_MESSAGES;

  const close = useCallback(() => {
    setOpen(false);
    launcher.focus();
  }, [launcher]);

  useEffect(() => {
    const set = (e: Event) => setOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener('conops-chat-set', set);
    return () => window.removeEventListener('conops-chat-set', set);
  }, []);

  useEffect(() => {
    launcher.setAttribute('aria-expanded', String(open));
    setOpenFlag(open);
    if (open) input.current?.focus();
  }, [open, launcher]);

  useEffect(() => save(state), [state]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [state.messages.length, busy, open]);

  // Esc closes; Tab stays inside the panel while it is open.
  const onKeyDown: ComponentProps<'div'>['onKeyDown'] = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')];
    if (!items.length) return;
    const first = items[0];
    const lastItem = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && document.activeElement === lastItem) {
      e.preventDefault();
      first.focus();
    }
  };

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || busy || ended) return;
    const before = state.messages;
    const messages: Msg[] = [...before, { role: 'user', content }];
    setState((s) => ({ ...s, messages }));
    setDraft('');
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: state.id, page: window.location.href, messages }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; limit?: string; disabled?: boolean };
      if (body.reply) {
        setState((s) => ({
          ...s,
          messages: [...messages, { role: 'assistant', content: body.reply! }],
          ended: s.ended || Boolean(body.limit || body.disabled),
        }));
      } else {
        throw new Error('no reply');
      }
    } catch {
      // Take the unanswered message back out so the conversation stays in order.
      setState((s) => ({ ...s, messages: before }));
      setDraft(content);
      setNotice(`Sorry, that didn't go through. Please try again, or email ${cfg.email}.`);
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  const onSubmit: ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();
    void send(draft);
  };

  const startOver = () => {
    setState({ id: newId(), messages: [], ended: false });
    setNotice('');
    input.current?.focus();
  };

  if (!open) return null;

  const bubble = 'max-w-[85%] whitespace-pre-line break-words rounded-[10px] px-3.5 py-2.5';
  const chip =
    'rounded-full border-[1.5px] border-navy bg-white px-4 py-2.5 text-sm font-semibold text-navy no-underline hover:bg-surface-alt disabled:opacity-60';

  return (
    <div
      ref={panel}
      id="chat-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-panel-title"
      onKeyDown={onKeyDown}
      className="fixed bottom-[88px] right-4 z-50 flex max-h-[min(600px,calc(100dvh-112px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-[10px] border border-line-strong bg-white text-[15px] leading-normal text-ink shadow-[0_8px_24px_rgba(2,53,104,0.18)]"
    >
      <div className="on-dark flex items-center gap-3 bg-navy py-2 pl-[18px] pr-2 text-white">
        <h2 id="chat-panel-title" className="flex-1 text-[15px] font-medium text-white">
          {cfg.title}
        </h2>
        <button type="button" onClick={close} className="flex size-11 items-center justify-center rounded text-white hover:bg-white/10">
          <span className="sr-only">Close chat</span>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div ref={log} role="log" aria-live="polite" aria-label="Conversation" className="flex min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto p-[18px]">
        <div className={`${bubble} self-start bg-surface-alt`}>{greeting}</div>
        {state.messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className={`${bubble} self-end bg-navy text-white`}>
              <span className="sr-only">You: </span>
              {m.content}
            </div>
          ) : (
            <div key={i} className={`${bubble} self-start bg-surface-alt`}>
              <span className="sr-only">Assistant: </span>
              {linkify(m.content, cfg)}
            </div>
          ),
        )}
        {busy && (
          <div className={`${bubble} self-start bg-surface-alt text-ink-muted`} aria-label="The assistant is typing">
            …
          </div>
        )}
        {!ended && (
          <div className="flex flex-wrap gap-2">
            <a className={chip} href={cfg.bookingUrl} target="_blank" rel="noopener">
              Book a demo
            </a>
            <button type="button" className={chip} disabled={busy} onClick={() => void send('Please have someone call me.')}>
              Have someone call me
            </button>
          </div>
        )}
        {ended && (
          <button type="button" className={`${chip} self-start`} onClick={startOver}>
            Start a new chat
          </button>
        )}
      </div>

      {notice && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-700">
          {notice}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2.5 border-t border-[#e3e6e9] px-3.5 py-3">
        <label htmlFor="chat-input" className="sr-only">
          Type a message
        </label>
        <input
          ref={input}
          id="chat-input"
          type="text"
          autoComplete="off"
          maxLength={MAX_CHARS}
          disabled={ended}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={ended ? 'This chat has ended' : 'Type a question'}
          className="min-w-0 flex-1 rounded-md border border-[#7b8186] px-3 py-[11px] text-[15px] focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30 disabled:bg-surface-alt"
        />
        <button
          type="submit"
          disabled={busy || ended || !draft.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-navy text-white hover:bg-navy-deep disabled:opacity-60"
        >
          <span className="sr-only">Send message</span>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
      <p className="px-4 pb-3 text-xs text-ink-muted">
        Answers come from this website and can be wrong. Please confirm details with our team.
      </p>
    </div>
  );
}

export function mountChat(root: HTMLElement, launcher: HTMLButtonElement, cfg: ChatConfig) {
  createRoot(root).render(<ChatPanel cfg={cfg} launcher={launcher} />);
}
