# conops-web — CLAUDE.md

## What this repo is

The marketing website for Constructive Operations (constructiveoperations.com,
replacing the Wix site) and Sundial (sundialcrm.com). Astro + Tailwind +
TypeScript, built as static pages, deployed on Vercel. One Vercel project serves
both domains; `vercel.json` serves `src/pages/sundial/**` at the root of
sundialcrm.com.

It is **separate from the Sundial portal repos** and never contains anything
from them.

## Standing rules (these do not bend)

1. **No client data.** No client names, logos, testimonials, rates, record ids,
   staff names or numbers from the Sundial portals or anywhere else — not in
   pages, content, data files, comments, commits or docs. Example people and
   companies are invented; phone numbers use `555-01xx`; emails use
   `@example.com`. A real client name appears only with Tim's written OK,
   recorded in `DECISIONS.md`.
2. **The website never gives access to the Sundial demo portal.** No login link,
   no "try it" button, no embed. The demo portal's address never appears in
   pages, content, data files, comments, commits, docs **or chat answers**. The
   site shows only screenshots and recordings Tim supplies (`ScreenshotSlot`).
   The call to action is always **"book a demo"** (`BookDemoButton`, Microsoft
   Bookings link in `src/data/site.ts`).
3. **Client Portal Login** (`site.clientPortalUrl`) appears in the Constructive
   Operations footer only — never on Sundial pages.
4. **Never commit secrets.** Real values live in `.env.local` (git-ignored) and in
   Vercel's settings. `.env.example` may hold names with dummy values.
5. **No invented claims.** Copy must not invent testimonials, client names,
   statistics or claims. Anything not final starts with `PLACEHOLDER:` (strings)
   or uses `<p class="placeholder">` (Markdown) so it shows visibly on the page.
6. **Launch switch.** `site.launched` in `src/data/site.ts` is `false` until
   launch: every page is `noindex, nofollow` and both robots.txt files disallow
   everything. Only Tim decides when it flips.
7. **No DNS or domain changes** without Tim's explicit go-ahead in chat.
   constructiveoperations.com DNS is at Wix with Microsoft 365 email on it;
   sundialcrm.com is at GoDaddy with existing subdomains that must not be
   touched.
8. **Analytics:** Vercel Web Analytics only. No ad pixels, no cookie notice.

## Branches, commits and deploys

- **Before launch:** work on `main`. Pushing `main` deploys to production on Vercel.
- **After the domains point at this project:** every change goes on a branch,
  is checked on its Vercel preview, then merged with:
  `git merge --no-ff <branch> -m "Merge <branch>"` and pushed.
- Claude commits and pushes itself, then reports what went out:
  `git add -A`, then `git status --short` (read it — nothing unexpected),
  then `git commit`, then `git push`.

## Journal (every session)

- `PROGRESS.md` — a dated entry for every session: what changed, what was pushed,
  the `npm run check` result.
- `TASKS.md` — open items. Add new ones; tick off finished ones.
- `DECISIONS.md` — dated decisions with the reason.

## Where things live

- Copy:
  - Home page: `src/data/home.ts`; its animated process hero: `src/data/process.ts`
    (step labels kept exactly as in the approved mock-up).
  - Sundial page: `src/data/sundial.ts` (including the five walkthrough steps; each
    step can take `video`, `poster` and `frame` later).
  - Services (six cards): `src/content/services/*.md`.
  - Other pages: `src/content/pages/*.md`; landing pages `src/content/landing/*.md`
    (each file becomes `/lp/<name>`). Field rules: `src/content.config.ts`.
- Approved design: `design-reference/` (mock-ups + source PDFs). Reference only, never
  served. Do not use the data sheet's tax-credit / ITC deadline paragraphs, and never
  show the per-project price.
- Settings (launch switch, domains, booking link, contact details, form submit
  address, chat widget switch, nav): `src/data/site.ts`.
- Colours and fonts (tokens): `src/styles/global.css` (`@theme`) and the
  `fonts` block in `astro.config.mjs`. EuroStyle (one weight, `font-display` utility,
  never bold) for the main headline, nav, buttons and card titles; Roboto 700 for the
  lowercase section headings; Roboto 400/500 for body. EuroStyle woff2 is made from
  `brand/fonts/EuroStyle-Normal.ttf` by `npm run fonts:convert`.
- Accent amber (`bg-accent`, text `text-on-accent`) on Sundial pages and the home
  page's Sundial section ONLY.
- Photos: `src/assets/photos/` with `CREDITS.md`.
- Layouts: `BaseLayout` (head, noindex, canonical, analytics, skip link, chat
  widget slot) → `SiteLayout` / `SundialLayout` / `LandingLayout`.
- React only for components that must run in the browser
  (`src/components/islands/`, loaded with `client:visible` / `client:idle`).
- Sundial pages link out with `sundialUrl()` / `coUrl()` from `src/lib/urls.ts`
  (static pages can't tell which domain they're on).
- Original brand files: `brand/` (never served). Web copies with simple names:
  `src/assets/brand/`.
- Domain routing and redirects: `vercel.json` (`routes`, because routes run
  before static files; plain `rewrites` would not override `/`).

## Accessibility and performance

- Animation only inside `motion-safe:` or a `prefers-reduced-motion` check.
  Sections fade in once via `data-reveal` (only when `html.reveal-on` is set, which
  BaseLayout adds when motion is allowed). The home hero process plays once and
  holds; under reduced motion it shows the finished state. Walkthrough videos
  never autoplay under reduced motion (poster only).
- Images through Astro `<Image>`/`<Picture>` from `src/assets/` with width and
  height. No images straight from `public/` except favicons.
- No layout shift: images and embeds have fixed sizes or `aspect-ratio`; fonts
  are self-hosted with size-matched fallbacks (Astro Fonts API).
- `brand-gray` (#9CA1A4) is 2.6:1 on white — never for text. Use `ink-muted`.
- Every image has `alt` (`alt=""` if decorative); form fields have labels;
  keyboard focus is visible; headings in order.

## Checks before calling work done

- `npm run check` passes: type check (`astro check`), build, and
  `scripts/check-clean.mjs` (block list kept **outside** the repo at
  `..\conops-web-blocklist.txt`, plus built-in demo-portal phrases).
- New copy has no invented claims; unfinished copy is marked as a placeholder.

## How Tim works

- Plain English. Explain trade-offs in practical terms; do not assume terminal,
  Git or deployment knowledge.
- Windows: give **PowerShell** commands and Windows paths.
- Step-by-step instructions, **each command in its own code block**.
- Never say "merge this" or "ask Claude Code to do X" in general terms — give the
  exact commands, and write out the exact prompt to paste when one is needed.
- Prefer the simpler option and note future improvements.
- In this repo Claude commits and pushes itself and reports back (see above).

## Local development

```powershell
npm install
```

```powershell
npm run dev
```

Then open http://localhost:4321 (Sundial pages: http://localhost:4321/sundial).
