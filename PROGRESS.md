# Progress

Newest first. One entry per session.

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
