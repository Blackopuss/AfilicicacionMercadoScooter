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
      // Fuera las páginas noindex: panel, 404 y confirmación/baja de alertas.
      filter: (page) => !/^\/(admin|404|alertas)\//.test(new URL(page).pathname),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
