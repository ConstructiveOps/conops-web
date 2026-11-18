import { getEntry } from 'astro:content';

/** Load a page's copy from src/content/pages/<id>.md, failing the build if missing. */
export async function getPage(id: string) {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`Missing src/content/pages/${id}.md`);
  return entry;
}
