# Decisions

Newest first. Each entry: date, decision, why.

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
