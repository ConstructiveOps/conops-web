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

  // Fonts are self-hosted (no request to Google). Astro generates
  // size-matched fallbacks so text does not jump when a web font arrives.
  // - EuroStyle: brand display face (headline, nav, buttons, card titles).
  //   ONE weight only (400). Never set it bold: font-synthesis is off.
  //   Source TTF in brand/fonts; woff2 made by scripts/convert-fonts.mjs.
  // - Roboto 700: lowercase section headings. Roboto 400/500: body.
  // To swap a font, change it here and keep the cssVariable names.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'EuroStyle',
      cssVariable: '--font-eurostyle',
      fallbacks: ['sans-serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/EuroStyle-Normal.woff2'], weight: '400', style: 'normal' }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Roboto',
      cssVariable: '--font-roboto',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: ['./node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff2'], weight: '400', style: 'normal' },
          { src: ['./node_modules/@fontsource/roboto/files/roboto-latin-400-italic.woff2'], weight: '400', style: 'italic' },
          { src: ['./node_modules/@fontsource/roboto/files/roboto-latin-500-normal.woff2'], weight: '500', style: 'normal' },
          { src: ['./node_modules/@fontsource/roboto/files/roboto-latin-700-normal.woff2'], weight: '700', style: 'normal' },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
