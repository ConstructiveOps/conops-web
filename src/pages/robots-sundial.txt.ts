// robots.txt for sundialcrm.com (vercel.json serves this at /robots.txt on
// that domain). Controlled by site.launched.
import type { APIRoute } from 'astro';
import { site } from '../data/site';

export const GET: APIRoute = () => {
  const body = site.launched
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site.domains.sundial}/sitemap.xml\n`
    : `# Pre-launch: nothing may be indexed.\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
