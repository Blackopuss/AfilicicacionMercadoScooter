// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';

// Dominio público (canonical, Open Graph, sitemap): SITE_URL en .env o en Cloudflare Pages.
// El placeholder solo evita que el build falle mientras no hay dominio.
const { SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  site: SITE_URL || 'https://example.com',
  integrations: [
    sitemap({
      filter: (page) => {
        const ruta = new URL(page).pathname;
        return !ruta.startsWith('/admin') && ruta !== '/404/';
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
