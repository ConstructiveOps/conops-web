// Sitemap for sundialcrm.com (vercel.json serves this at /sitemap.xml on
// that domain). Lists every page under src/pages/sundial/.
import type { APIRoute } from 'astro';
import { site } from '../data/site';

const files = Object.keys(import.meta.glob('./sundial/**/*.astro'));

export const GET: APIRoute = () => {
  const paths = files
    .map((f) => f.replace(/^\.\/sundial/, '').replace(/\.astro$/, '').replace(/\/index$/, '') || '/')
    .filter((p) => !p.includes('['));
  const urls = paths.map((p) => `  <url><loc>${site.domains.sundial}${p}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
