import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { knowledge } from '../api/_generated/knowledge';
import { BUILT_IN_DENY, hasPrice } from '../api/_lib/filter';
import { SYSTEM_PROMPT } from '../api/_lib/prompt';
import { site } from '../src/data/site';

describe('chat fact sheet', () => {
  it('is up to date with src/data and src/content', () => {
    expect(() => execFileSync(process.execPath, ['scripts/build-chat-knowledge.mjs', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
  it('has no price, placeholder, client portal or demo-portal phrases', () => {
    expect(hasPrice(knowledge)).toBe(false);
    expect(knowledge).not.toMatch(/PLACEHOLDER/);
    expect(knowledge).not.toContain(site.clientPortalUrl);
    expect(knowledge).not.toMatch(/portal\.constructiveoperations/);
    for (const re of BUILT_IN_DENY) expect(knowledge).not.toMatch(re);
  });
  it('leaves out screenshot and recording box descriptions', () => {
    expect(knowledge).not.toMatch(/\[(SCREEN RECORDING|HERO VIDEO|RECORDING \d|VISUAL|CLIENT QUOTE)\]/);
    expect(knowledge).not.toContain('silent loop');
  });
  it('is part of the system prompt', () => {
    expect(SYSTEM_PROMPT).toContain(knowledge);
    expect(SYSTEM_PROMPT).toContain(site.bookingUrl);
  });
});
