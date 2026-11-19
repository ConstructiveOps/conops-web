// Builds the chat assistant's fact sheet from the site's own copy:
// src/data/*.ts and src/content/**/*.md → api/_generated/knowledge.ts
//
// Runs before every build (npm run build / npm run check). The output is
// committed so the /api functions always have it, and a test fails if it is
// out of date. Left out on purpose: anything marked PLACEHOLDER, screenshot
// and recording box descriptions, the client portal address, and the draft
// privacy text. The build stops if the fact sheet contains a price.
//
// Usage:  node scripts/build-chat-knowledge.mjs          (write the file)
//         node scripts/build-chat-knowledge.mjs --check  (fail if out of date)

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => import(pathToFileURL(join(root, rel)).href);

const { site } = await load('src/data/site.ts');
const { home } = await load('src/data/home.ts');
const { processSteps, processCopy } = await load('src/data/process.ts');
const { sundial } = await load('src/data/sundial.ts');
const { hasPrice } = await load('api/_lib/filter.ts');

function frontmatter(rel) {
  const text = readFileSync(join(root, rel), 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parseYaml(m[1]) : {};
}

const keep = (s) => typeof s === 'string' && s.trim() && !s.trim().startsWith('PLACEHOLDER');
const lines = [];
const h = (t) => lines.push('', `## ${t}`);
const p = (...items) => items.flat().filter(keep).forEach((s) => lines.push(s));
const li = (...items) => items.flat().filter(keep).forEach((s) => lines.push(`- ${s}`));

// --- Company and contact -------------------------------------------------
h('Company and contact details');
li(
  `${site.company.name} (${site.company.legalName}), website ${site.domains.co}`,
  `Sundial is Constructive Operations' operations platform, website ${site.domains.sundial}`,
  `Email: ${site.company.email}`,
  `Phone: ${site.company.phone}`,
  `Mailing address: ${site.company.address.join(', ')}`,
  `Book a 30-minute demo (Microsoft Bookings): ${site.bookingUrl}`,
  'The way to see Sundial is a demo booked with the team, shown on a screen share.',
  `Pages on constructiveoperations.com: ${site.domains.co}/services, ${site.domains.co}/about, ${site.domains.co}/contact`,
);

// --- Home page -----------------------------------------------------------
h('Constructive Operations (home page)');
p(processCopy.heading, processCopy.intro, home.description);
p(`"${processCopy.definition.word}" (${processCopy.definition.partOfSpeech}): ${processCopy.definition.meaning}.`);
lines.push('Key facts:');
li(home.stats.map((s) => `${s.figure} ${s.label}`));
p(home.about.lead, home.about.paragraphs, home.brand.paragraph, home.services.intro, home.contact.paragraph);

h('The solar project process: who does what');
p('From contract to activation there are 15 steps handled by the Constructive Operations team and 5 by the contractor\'s own team.');
lines.push('By stage, in order (our team = Constructive Operations; your team = the contractor):');
processSteps.forEach((step, i) => {
  const parts = [];
  if (step.ours.length) parts.push(`our team: ${step.ours.join('; ')}`);
  if (step.yours.length) parts.push(`your team: ${step.yours.join('; ')}`);
  li(`Stage ${i + 1} (${step.alt}): ${parts.join('. ')}`);
});
p(`Our team: ${processCopy.ourTeam.note}. Your team: ${processCopy.yourTeam.note}.`);

// --- Services ------------------------------------------------------------
h('Services (all white-labeled under the contractor\'s brand)');
const services = readdirSync(join(root, 'src/content/services'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => frontmatter(`src/content/services/${f}`))
  .sort((a, b) => a.order - b.order);
for (const s of services) {
  lines.push('', `### ${s.title}`);
  p(s.summary);
  li(s.points);
}

for (const name of ['services', 'about', 'contact']) {
  const page = frontmatter(`src/content/pages/${name}.md`);
  h(`${name} page`);
  p(page.description, page.intro ?? []);
  for (const sec of page.sections ?? []) {
    const body = [...(sec.paragraphs ?? []), ...(sec.bullets ?? [])].filter(keep);
    p(body);
  }
}

// --- Sundial -------------------------------------------------------------
h('Sundial (sundialcrm.com)');
p(sundial.hero.heading, sundial.hero.intro, sundial.description);
lines.push('', `### ${sundial.platform.heading}`);
p(sundial.platform.intro);
li(sundial.platform.modules.map((m) => `${m.name}: ${m.note}`));
lines.push('', `### ${sundial.features.heading}`);
li(sundial.features.items.map((f) => `${f.title.replace(/\.$/, '')}: ${f.body}`));
lines.push('', `### ${sundial.walkthrough.heading}`);
p(sundial.walkthrough.intro);
li(sundial.walkthrough.steps.map((s) => `${s.title} ${s.body}`));
lines.push('', `### ${sundial.builtBy.heading}`);
p(sundial.builtBy.paragraph);
lines.push('', `### ${sundial.demo.heading}`);
p(sundial.demo.paragraph);
p(home.sundial.lead, home.sundial.paragraph);

const knowledge = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';

if (hasPrice(knowledge)) {
  console.error('build-chat-knowledge: the fact sheet contains a price. Remove it from the copy.');
  for (const l of knowledge.split('\n')) if (hasPrice(l)) console.error('  ' + l);
  process.exit(1);
}

const siteFacts = {
  launched: site.launched,
  bookingUrl: site.bookingUrl,
  email: site.company.email,
  phone: site.company.phone,
  phoneHref: site.company.phoneHref,
  domains: site.domains,
};

const out =
  '// GENERATED by scripts/build-chat-knowledge.mjs from src/data and src/content.\n' +
  '// Do not edit by hand: change the copy, then run npm run build (or npm run check).\n\n' +
  `export const siteFacts = ${JSON.stringify(siteFacts, null, 2)} as const;\n\n` +
  `export const knowledge = ${JSON.stringify(knowledge)};\n`;

const target = join(root, 'api/_generated/knowledge.ts');
if (process.argv.includes('--check')) {
  // Ignore Windows line endings (Git may check the file out with CRLF).
  const current = existsSync(target) ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current !== out) {
    console.error('api/_generated/knowledge.ts is out of date. Run: npm run knowledge');
    process.exit(1);
  }
  console.log('build-chat-knowledge: up to date.');
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out);
  console.log(`build-chat-knowledge: wrote api/_generated/knowledge.ts (${knowledge.length} characters).`);
}
