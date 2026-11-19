# Decisions

Newest first. Each entry: date, decision, why.

## 2026-11-19 — Contact form and chat assistant on Vercel functions

- **Vercel functions in `api/` replace the earlier AWS plan** for the contact
  form. Pages stay static; only `/api/contact` and `/api/chat` run on the server.
  Plain functions (not an Astro adapter) so `vercel.json` routes stay as they are.
- **Salesforce Web-to-Lead** for both form and chat leads: needs only the org ID
  and field codes, no Salesforce login in the project. Lead Source "Website";
  custom fields Text Consent, Website Site, Website Page, Website Channel,
  Website Test Lead.
- **Live leads only when `LEAD_MODE=live` AND `site.launched` is true.** Pushes to
  main are Production on Vercel before the domains are attached, so every other
  case creates a test lead (test box ticked, "[TEST]" in Description, no alert).
- **Not connected = fallback.** If `SF_ORG_ID` or any field code is missing,
  `/api/contact` says it is not connected and the form shows the existing
  "email us or book a demo" message, with no error.
- **Chat model from `CHAT_MODEL`, default Claude Sonnet 5.5**, effort low,
  1,024-token hard stop, fact sheet cached. Anthropic's server-side backup model
  (`fallbacks: "default"`) is on for Sonnet/Opus (Haiku 5.5 has none). Every
  reply, from the main or the backup model, goes through the same server-side
  filter.
- **The chat never sets Text Consent**; chat leads always arrive unticked. A chat
  lead is created only with a name plus an email or phone that the visitor
  actually typed, at most once per conversation.
- **Limits:** contact 5/hour and 10/day per visitor; chat 12 messages per
  conversation, 40 per visitor per day, 1,000 site-wide per day; replies capped.
  Counters in the free Upstash Redis (Vercel Marketplace), keyed on a salted,
  daily-changing hash of the address; the chat refuses to run on Vercel without
  Redis. Firewall burst rule (30/min on `/api/`) is Tim's step and works on any plan.
- **Kill switches:** `site.chatWidget.enabled` (launcher), `CHAT_ENABLED=true`
  (server), and disabling the API key in the Anthropic Console.
- **Text-consent checkbox wording** changed to the fuller carrier-style text.
  Nothing sends texts; the checkbox only records consent.
- **Privacy page** drafted for the form, chat, limits and texting; keeps a visible
  "Draft" marker until Tim confirms it has been reviewed.
- **`concrete-structure.jpg`**: sourced from Canva through the Constructive
  Operations account; licence to be confirmed against the Canva plan.

## 2026-11-19 — Review fixes at 1440px

- **EuroStyle only at 22px and up** (too thin below that): headlines, section
  sub-headlines, stat numbers, card titles (raised to at least 22px). Nav links,
  buttons, the footer "links." heading and other small text moved to Roboto 500.
- **Home header logo:** the wide logo at 48px on navy. No white version of the wide
  logo exists in brand/, so `src/assets/brand/co-logo-wide-white.png` is generated
  from `brand/Wide Logo - Full Size.png` by `scripts/make-white-wide-logo.mjs`
  (navy to white, mark ring stays gray, "OPERATIONS" lightened to #DFE6EE). Replace
  with an official white wide logo when one exists.
- **Sundial header logo** at 64px.
- **Facebook restored** in the Constructive Operations footer only, beside LinkedIn.

## 2026-11-19 — Home and Sundial pages built to the approved design

- **Fonts changed:** EuroStyle (one weight, self-hosted woff2, synthetic bold off)
  for the main headline, nav, buttons and card titles; Roboto 700 for the lowercase
  section headings; Roboto 400/500 for body. Montserrat and Inter removed.
- **Accent chosen: amber #C2780A**, text on amber #14100a. Used on Sundial pages and
  the home page's Sundial section only (the services page's Sundial section has no accent).
- **Home hero = the animated process** from hero-process.reference.html, replacing
  the photo hero and the "point of sale to PTO" step strip. Plays once when in view,
  holds, Replay button; finished state under reduced motion or without JavaScript;
  vertical timeline below 900px. The home page header is navy to sit on the hero.
- **Services = the six from deck page 4**, five points each, summaries from the
  data sheet. Points are written in sentence case (the deck uses title case and
  capitals). The services page lists the same six cards.
- **Copy moved to data files** for the home page (`src/data/home.ts`, `process.ts`)
  and the Sundial page (`src/data/sundial.ts`); `home.md`, `sundial.md` and
  `sundial-promo.md` were removed.
- **Mock-up wording trimmed in one place:** the Sundial hero video description
  referred to where the recording is made; trimmed so the site never mentions the
  demo portal.
- **Chat panel from the home mock-up not built**; its column holds the contact
  details instead. `site.chatWidget.enabled` stays false.
- **Footers follow the mock-ups:** Facebook link dropped from the footers (still in site.ts).
- **Not used from the data sheet:** the tax credit / ITC deadline paragraphs and the
  per-project price.

## 2026-11-18 — Initial setup (plan approved by Tim)

- **Astro, static pages, Tailwind v4, TypeScript strict, React only for islands.**
  Fast pages with no JavaScript by default; copy lives in Markdown/data files.
- **One Vercel project for both domains.** `vercel.json` uses `routes` (which run
  before static files) to serve `/sundial/**` at the root of sundialcrm.com.
  Plain `rewrites` were rejected: Vercel checks static files first, so
  sundialcrm.com/ would have shown the Constructive Operations home page.
- **sundialcrm.com is the official address for Sundial pages.**
  constructiveoperations.com/sundial permanently redirects there. CO home and
  services carry a Sundial section linking to sundialcrm.com; Sundial pages link
  back to constructiveoperations.com wherever back-office services come up.
- **No demo-portal access from the website.** Only supplied screenshots and
  recordings; the call to action is always "book a demo" (Microsoft Bookings).
- **Contact form:** React island posting JSON to `site.contactFormEndpoint`
  (empty for now). No hosted form service, no Vercel function. A later step
  connects an AWS endpoint.
- **Chat widget:** reserved slot in `BaseLayout`, switched off in `site.ts`.
- **Launch switch** `site.launched = false`: noindex everywhere, robots disallow all.
- **Fonts:** Montserrat (headings) + Inter (body), self-hosted from the
  `@fontsource-variable` packages through Astro's Fonts API (`local` provider,
  latin subset), with size-matched fallbacks. The `npm` font provider failed on
  Windows (could not read `file://` font paths), so the files are referenced
  directly.
- **Colours:** navy #023568, gray #9CA1A4 (lines/icons only — fails text
  contrast), ink-muted #5F6468 for small gray text. Accent is a loud magenta
  placeholder, used on Sundial pages only, until Tim chooses one.
- **Sundial logo:** the colour PNGs have a baked-in off-white background
  (#FEFEFE). For now they sit only on `bg-sundial-panel` (#FEFEFE) surfaces; the
  Sundial footer uses the wordmark set in type. Long-term fix: an SVG logo (TASKS).
- **Live-site copy carried over** (Nov 2026) including the existing claims
  "40 years of experience" and "over 10,000 solar projects". Two light edits:
  "let's" → "lets", "less cancellations" → "fewer cancellations". The single
  unattributed testimonial from the Wix site was **not** carried over (see TASKS).
- **Section heading style:** lowercase one word with a full stop ("services.").
- **Analytics:** Vercel Web Analytics only; no cookie notice.
- **`brand/` committed as supplied** (originals, never served).
