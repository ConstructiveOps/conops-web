# Progress

Newest first. One entry per session.

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
