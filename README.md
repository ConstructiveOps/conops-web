# conops-web

Marketing website for Constructive Operations (constructiveoperations.com) and
Sundial (sundialcrm.com). Astro + Tailwind, static pages, deployed on Vercel.

Start with [CLAUDE.md](CLAUDE.md) for the rules, then:

- [PROGRESS.md](PROGRESS.md) — session journal
- [TASKS.md](TASKS.md) — open items
- [DECISIONS.md](DECISIONS.md) — decisions and why

## Run it locally

```powershell
npm install
```

```powershell
npm run dev
```

Open http://localhost:4321 (Sundial: http://localhost:4321/sundial).

## Check before pushing

```powershell
npm run check
```

## Edit copy

Text lives in `src/content/` (Markdown) and `src/data/site.ts` (settings,
contact details, booking link). Components only lay it out.
