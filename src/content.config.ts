import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Copy lives in src/content/**.md. Components only lay it out.
// Any string that starts with "PLACEHOLDER:" is shown with a visible
// placeholder marker (see src/components/Text.astro).

const section = z.object({
  /** Anchor id, e.g. "about" -> /#about */
  id: z.string(),
  /** Lowercase one-word style, e.g. "about." */
  heading: z.string(),
  paragraphs: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    /** <title> and social title */
    title: z.string(),
    /** <meta name="description"> */
    description: z.string(),
    /** Large heading at the top of the page */
    heading: z.string(),
    intro: z.array(z.string()).default([]),
    sections: z.array(section).default([]),
    /** Optional dictionary-style block (home page). */
    definition: z
      .object({ word: z.string(), partOfSpeech: z.string(), meaning: z.string(), synonyms: z.array(z.string()).default([]) })
      .optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
  }),
});

const landing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    intro: z.array(z.string()).default([]),
    /** Which brand the page wears. */
    brand: z.enum(['co', 'sundial']).default('co'),
    /** Landing pages are noindex unless this is true AND the site is launched. */
    index: z.boolean().default(false),
  }),
});

export const collections = { pages, services, landing };
