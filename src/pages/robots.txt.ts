import type { APIRoute } from 'astro';

// Generado para que la línea Sitemap use el dominio de `site` (SITE_URL).
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nDisallow: /admin\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`);
