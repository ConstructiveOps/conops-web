// robots.txt for constructiveoperations.com. Controlled by site.launched.
import type { APIRoute } from 'astro';
import { site } from '../data/site';

export const GET: APIRoute = () => {
  const body = site.launched
    ? `User-agent: *\nAllow: /\nDisallow: /lp/\n\nSitemap: ${site.domains.co}/sitemap-index.xml\n`
    : `# Pre-launch: nothing may be indexed.\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
