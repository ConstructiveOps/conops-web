// Fails if the repo contains anything on the private block list or any
// demo-portal style wording. The block list (client names, the demo portal's
// address, etc.) is kept OUTSIDE this repo, because the list itself would be
// client data. Default location: ../conops-web-blocklist.txt (one term per
// line, # for comments). Override with CONOPS_BLOCKLIST=<path>.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const listPath = process.env.CONOPS_BLOCKLIST ?? resolve(root, '..', 'conops-web-blocklist.txt');
const skipDirs = new Set(['node_modules', '.git', '.astro', '.vercel', 'brand']);
const textExt = /\.(astro|ts|tsx|js|mjs|cjs|json|md|mdx|css|html|txt|xml|yml|yaml)$/i;

// Built-in phrases that would offer demo-portal access (CLAUDE.md rule).
const builtIn = [/try the demo/i, /demo login/i, /log ?in to (the )?demo/i, /free trial/i, /sandbox account/i];

const terms = existsSync(listPath)
  ? readFileSync(listPath, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  : [];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (textExt.test(name) && name !== 'package-lock.json') yield p;
  }
}

const hits = [];
for (const file of walk(root)) {
  const rel = relative(root, file).split(sep).join('/');
  if (rel === 'scripts/check-clean.mjs' || rel === 'CLAUDE.md') continue; // they describe the rules
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const t of terms) if (line.toLowerCase().includes(t.toLowerCase())) hits.push(`${rel}:${i + 1}  [block list term]`);
    for (const re of builtIn) if (re.test(line)) hits.push(`${rel}:${i + 1}  ${re}`);
  });
}

if (!terms.length) console.warn(`check-clean: no block list at ${listPath} — only built-in phrases checked.`);
if (hits.length) {
  console.error('check-clean: FAILED\n' + hits.join('\n'));
  process.exit(1);
}
console.log(`check-clean: OK (${terms.length} block-list terms, ${builtIn.length} built-in phrases)`);
