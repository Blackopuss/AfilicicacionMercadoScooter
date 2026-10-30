import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('el sitemap lista las páginas públicas y nunca /admin', () => {
  expect(readFileSync('dist/sitemap-index.xml', 'utf8')).toContain('/sitemap-0.xml');
  const urls = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(urls).toEqual(expect.arrayContaining(['/', '/comparar/', '/guias/', '/mejores/ligeros/', '/scooter/xiaomi-electric-scooter-5/']));
  expect(urls.some((u) => u.includes('-vs-'))).toBe(true);
  expect(urls.filter((u) => u.startsWith('/admin') || u === '/404/')).toEqual([]);
});

test('robots.txt apunta al sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /admin');
  expect(robots).toMatch(/^Sitemap: https:\/\/.+\/sitemap-index\.xml$/m);
});

test('cada comparativa existe en un solo orden', async ({ request }) => {
  expect((await request.get('/comparar/segway-ninebot-max-g2-vs-xiaomi-electric-scooter-5')).ok()).toBe(true);
  expect((await request.get('/comparar/xiaomi-electric-scooter-5-vs-segway-ninebot-max-g2')).status()).toBe(404);
});

const jsonLd = async (page: import('@playwright/test').Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));

test('canonical, Open Graph y datos estructurados', async ({ page }) => {
  await page.goto('/scooter/xiaomi-electric-scooter-5');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /^https:\/\/.+\/scooter\/xiaomi-electric-scooter-5\/$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
  const [migas, producto] = await jsonLd(page);
  expect(migas['@type']).toBe('BreadcrumbList');
  expect(migas.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Inicio', 'Comparar', 'Xiaomi Electric Scooter 5']);
  expect(producto['@type']).toBe('Product');
  expect(producto).not.toHaveProperty('aggregateRating');
  expect(producto).not.toHaveProperty('review');

  await page.goto('/guias/autonomia-real-vs-fabricante');
  expect((await jsonLd(page)).map((d) => d['@type'])).toEqual(['BreadcrumbList', 'Article']);

  await page.goto('/admin');
  await expect(page.locator('link[rel=canonical]')).toHaveCount(0);
});
