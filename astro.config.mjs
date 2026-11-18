// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// The Constructive Operations domain is the 'home' site. Sundial pages live
// under /sundial in the source and are served at the root of sundialcrm.com
// by vercel.json. They get their own sitemap (src/pages/sitemap-sundial.xml.ts).
export default defineConfig({
  site: 'https://constructiveoperations.com',
  trailingSlash: 'ignore',

  integrations: [
    react(),
    sitemap({
      // Sundial pages belong to sundialcrm.com; landing pages are never listed.
      filter: (page) => !/\/(sundial|lp)(\/|$)/.test(new URL(page).pathname),
    }),
  ],

  // Fonts are self-hosted from the installed @fontsource-variable packages
  // (latin subset, no request to Google). Astro generates size-matched fallbacks so text
  // does not jump when the web font arrives. To swap a font: install its
  // package, change it here, and keep the cssVariable names.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: ['./node_modules/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: ['./node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
