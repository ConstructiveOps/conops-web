# Progress

Newest first. One entry per session.

## 2026-11-19 — Contact form to Salesforce, chat assistant (built, switched off)

- `api/contact.ts`: validates, honeypot, rate limit (5/hour, 10/day), site from
  the request's domain, page without query string, forwards to Web-to-Lead.
  `GET /api/contact` tells the form whether it is connected; if not, the form
  shows the "email us or book a demo" fallback.
- `api/chat.ts`: Claude (CHAT_MODEL, default claude-sonnet-5-5, effort low,
  cached fact sheet, backup model on), one tool `create_lead`, caps per
  conversation / visitor / site, server-side reply filter, kill switch
  CHAT_ENABLED. Fact sheet generated from src/data + src/content
  (`scripts/build-chat-knowledge.mjs` → `api/_generated/knowledge.ts`).
- Chat launcher and panel (navy on Constructive Operations pages, amber on
  Sundial; "Ask Constructive Operations" / "Ask Sundial"), loaded on first click,
  keyboard and screen-reader friendly. `site.chatWidget.enabled` stays false.
- Contact form: fuller text-consent wording; email OR phone; field errors from
  the server; clear rate-limit and failure messages.
- `vercel.json`: the sundialcrm.com catch-all now leaves `/api/` alone.
- Privacy page wording drafted (Draft marker kept). `.env.example` added.
  Photo credit for `concrete-structure.jpg` updated (Canva).
- Tests: vitest (`npm test`). `scripts/chat-trick-questions.ts` for checking the
  live model (not run: no Vercel project or API key yet).
- Checked in a browser on the built site (`astro preview`, chat switched on
  locally only): panel opens and closes ("Ask Constructive Operations" navy,
  "Ask Sundial" amber launcher), Esc returns focus to the launcher, a failed send
  shows an error and keeps the text, the contact page shows the fallback when
  `/api/contact` is unreachable. Known local-only quirk: under `npm run dev` the
  panel can't open on pages with no other React component (Sundial page),
  because React's dev helper isn't loaded there; built pages are fine.

### Tim's setup steps, in order

1. Salesforce Setup → Object Manager → Lead → Fields & Relationships → New:
   Text Consent (Checkbox, default unchecked), Website Site (Text, 80),
   Website Page (URL), Website Channel (Picklist: "Contact form",
   "Chat assistant"), Website Test Lead (Checkbox, default unchecked). Add them
   to the Lead page layout. Check "Website" is a Lead Source picklist value.
2. Salesforce Setup → Web-to-Lead: enable, choose the default lead creator,
   leave "Require reCAPTCHA" off. Create Web-to-Lead Form with First Name, Last
   Name, Company, Email, Phone, Description, Lead Source and the five custom
   fields. Copy the `oid` and the five `00N…` codes from the generated HTML (and
   the form's action address if it isn't webto.salesforce.com).
3. Salesforce Setup → Classic Email Templates → "New website lead"; Email
   Alerts → "New website lead alert" (Lead, recipients Tim Murphy and Matt
   Murphy); Flows → record-triggered Flow on Lead created, conditions Lead
   Source = Website AND Website Test Lead = false, action the email alert. Activate.
4. Salesforce → Leads → list view "Website test leads" (Website Test Lead = true).
5. Anthropic Console → Settings → Workspaces → "conops-web", monthly spend limit
   $50; API keys "conops-web-chat-production" and "conops-web-chat-preview".
6. Vercel dashboard → create the project from GitHub ConstructiveOps/conops-web
   (no domains yet).
7. Vercel dashboard → project → Storage → Upstash Redis (free) → connect to
   Production and Preview.
8. Vercel dashboard → Settings → Environment Variables (see `.env.example`):
   ANTHROPIC_API_KEY, SF_ORG_ID, SF_FIELD_TEXT_CONSENT, SF_FIELD_SITE,
   SF_FIELD_PAGE, SF_FIELD_CHANNEL, SF_FIELD_TEST, LEAD_MODE, CHAT_ENABLED,
   RATE_LIMIT_SALT, DENY_TERMS; optional CHAT_MODEL, SF_WEB_TO_LEAD_URL,
   SF_DEBUG_EMAIL. Then redeploy.
9. Vercel dashboard → Firewall → rule "API burst limit": path starts with
   `/api/`, rate limit 30 per 60 seconds per IP, then deny.
10. Test on the deployment: one contact form submission and one chat "call me"
    → two test leads in "Website test leads", no alert emails. Delete them.

## 2026-11-19 — Review fixes (fonts, logos, Facebook, 390px / reduced motion)

- EuroStyle kept only at 22px+ (headlines, sub-headlines, stats, card titles raised
  to 22px+); nav, buttons, footer "links." and small text now Roboto 500.
- Home header: wide logo at 48px on navy (white version generated from the navy
  wide logo). Sundial header logo at 64px.
- Facebook back in the Constructive Operations footer only.
- Checked at 390px: no horizontal overflow on any page (measured in a 390px
  frame: page width equals viewport, no element past the right edge).
- Checked with reduced motion forced on (headless Chrome
  `--force-prefers-reduced-motion`): the fade-in class is never set, the hero
  shows its finished state with no animation, everything visible on load.
- `npm run check`: passed (see report).

## 2026-11-19 — Home and Sundial pages to the approved design

- Fonts: EuroStyle (from brand/fonts, converted to woff2, one weight, no faux bold)
  and Roboto 400/500/700, self-hosted via Astro Fonts. Montserrat/Inter removed.
- Home: animated process hero (10 icons in `src/assets/process`, labels exact,
  plays once in view, Replay, finished state under reduced motion, vertical
  timeline below 900px), stats strip, six service cards, about + your brand with
  the three Wix photos, Sundial section (amber), reviews slot, contact form.
- Sundial page: hero with browser-framed slot, platform modules, features,
  five-step walkthrough component (video/poster/frame ready; muted autoplay in
  view; poster under reduced motion), built-by section, demo call to action.
- Contact form: Company field, text-consent checkbox, "How can we help?", "or pick
  a time for a demo". Still not connected.
- Sections fade in once on scroll (off under reduced motion). Gray rings on navy.
- Restyled services, about, contact, privacy, landing layout and 404.
- Photos: all three downloaded, `src/assets/photos/CREDITS.md` added.
- `npm run check`: passed (0 errors, 0 warnings, 0 hints; 8 pages built;
  check-clean OK with the block list).
- Checked in the browser at 1440px and in a 390px frame.

## 2026-11-18 — Scaffold

- Created the Astro 7 site (static), with Tailwind v4, React (islands only),
  sitemap, Vercel Web Analytics, and self-hosted Montserrat + Inter.
- Pages: home, services, about, contact, privacy, sundial, `/lp/[slug]`
  (sample landing page), 404. Copy in `src/content/`, settings in
  `src/data/site.ts`.
- Copy drafted from the live Wix site (read-only); unfinished copy marked as
  placeholders. Wix page list: `/` and `/embed-tool` only.
- `vercel.json`: two-domain routing, www → apex, /sundial → sundialcrm.com,
  /embed-tool → /, per-domain robots.txt and sitemap. Not testable until a
  Vercel deploy exists.
- Launch switch off: noindex everywhere, robots disallow all.
- Contact form island (submit address empty → "not connected" in development,
  email/book-a-demo fallback in production). Chat widget slot reserved.
- Brand: tokens in `global.css`, web copies of logos in `src/assets/brand/`,
  favicons per brand. `brand/` originals committed.
- CLAUDE.md, DECISIONS.md, TASKS.md created. `scripts/check-clean.mjs` added.
- `npm run check`: passed (0 errors, 0 warnings, 0 hints; build complete;
  check-clean OK — no block list file yet, built-in phrases only).
- No Vercel project created, no domain or DNS changes.
