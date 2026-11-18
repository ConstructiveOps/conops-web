# Tasks

Open items. Tick when done and note the date.

## Content and brand

- [ ] Choose the Sundial accent colour (three options proposed 2026-11-18:
      amber #C2780A, teal #21979B, sky #1D91CB). Set `--color-accent` in
      `src/styles/global.css`.
- [ ] Sundial logo as SVG (redrawn or traced) so it works on any background.
      Test `Sundial Logo - White.png` on navy meanwhile — it looks faint.
- [ ] Replace every `PLACEHOLDER:` string and `.placeholder` block
      (Sundial page, services details, about, privacy, sample landing page).
- [ ] Supply Sundial screenshots/recordings for the Sundial page slots.
- [ ] Re-confirm the carried-over claims "40 years" and "over 10,000 projects".
- [ ] Testimonial from the Wix site: decide whether to use it. Needs the
      person's written permission and how they want to be credited.
- [ ] Privacy notice: legal review; add form data storage/retention once the
      form is connected.
- [ ] Social sharing image (og:image) for each brand.

## Build-out

- [ ] Connect the contact form to the AWS endpoint (`site.contactFormEndpoint`).
- [ ] Build the chat widget (slot reserved; `site.chatWidget.enabled`).
- [ ] Create the private block list at `..\conops-web-blocklist.txt` (client
      names, the demo portal's address, etc.) so `npm run check` scans for them.
- [ ] Lighthouse pass (target 95+) on home, Sundial and a landing page.

## Launch (needs Tim's go-ahead for each step)

- [ ] Create the Vercel project from the GitHub repo and check a preview deploy.
- [ ] Test the domain routing in `vercel.json` on Vercel (it can't be tested
      locally): sundialcrm.com/ shows the Sundial page; robots/sitemap per domain;
      www → apex; constructiveoperations.com/sundial → sundialcrm.com.
- [ ] Note: the /sundial redirect only makes sense once sundialcrm.com points
      at this project — move both domains together.
- [ ] Copy every existing DNS record before changing anything:
      constructiveoperations.com at Wix (Microsoft 365 email: MX, SPF, DKIM,
      autodiscover); sundialcrm.com at GoDaddy (existing subdomains untouched).
- [ ] Redirect list from the Wix site: `/` (anchors #about, #contact, #projects
      stay valid on the new home page), `/embed-tool` → `/` (already in vercel.json).
- [ ] Flip `site.launched` to true; submit sitemaps in Google Search Console.
- [ ] After launch, switch to branch + preview + `git merge --no-ff` workflow.
