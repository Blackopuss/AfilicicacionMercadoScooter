import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('el sitemap lista las páginas públicas y ninguna noindex', () => {
  expect(readFileSync('dist/sitemap-index.xml', 'utf8')).toContain('/sitemap-0.xml');
  const urls = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(urls).toEqual(expect.arrayContaining(['/', '/comparar/', '/guias/', '/mejores/ligeros/', '/scooter/segway-e3-pro/']));
  expect(urls.some((u) => u.includes('-vs-'))).toBe(true);
  expect(urls.filter((u) => /^\/(admin|404|alertas)\//.test(u))).toEqual([]);
});

test('robots.txt apunta al sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /admin');
  expect(robots).toMatch(/^Sitemap: https:\/\/.+\/sitemap-index\.xml$/m);
});

test('cada comparativa existe en un solo orden', async ({ request }) => {
  expect((await request.get('/comparar/segway-e3-pro-vs-segway-max-g3')).ok()).toBe(true);
  expect((await request.get('/comparar/segway-max-g3-vs-segway-e3-pro')).status()).toBe(404);
});

const jsonLd = async (page: import('@playwright/test').Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));

test('canonical, Open Graph y datos estructurados', async ({ page }) => {
  await page.goto('/scooter/segway-e3-pro');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /^https:\/\/.+\/scooter\/segway-e3-pro\/$/);
  const [migas, producto] = await jsonLd(page);
  expect(migas['@type']).toBe('BreadcrumbList');
  expect(migas.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Inicio', 'Comparar', 'Segway E3 Pro']);
  expect(producto['@type']).toBe('Product');
  expect(producto).not.toHaveProperty('aggregateRating');
  expect(producto).not.toHaveProperty('review');

  await page.goto('/guias/autonomia-real-vs-fabricante');
  expect((await jsonLd(page)).map((d) => d['@type'])).toEqual(['BreadcrumbList', 'Article']);

  await page.goto('/admin');
  await expect(page.locator('link[rel=canonical]')).toHaveCount(0);
});

test('cada ficha y A vs B comparte la foto del scooter en JPEG', async ({ page, request }) => {
  const og = (p: string) => page.locator(`meta[property="${p}"]`);
  for (const [ruta, nombre] of [['/scooter/segway-e3-pro', 'Segway E3 Pro'], ['/comparar/segway-e3-pro-vs-segway-max-g3', 'Segway E3 Pro']]) {
    await page.goto(ruta);
    const src = (await og('og:image').getAttribute('content'))!;
    expect(src).toMatch(/^https:\/\/.+\.jpe?g$/);
    expect(src).not.toMatch(/\/og\.png$/);
    await expect(og('og:image:alt')).toHaveAttribute('content', `Scooter eléctrico ${nombre}`);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', src);
    const imagen = await request.get(new URL(src).pathname);
    expect(imagen.headers()['content-type']).toBe('image/jpeg');
    expect((await imagen.body()).length).toBeLessThan(300 * 1024);
    expect(Number(await og('og:image:width').getAttribute('content'))).toBeGreaterThan(0);
  }
  await page.goto('/');
  await expect(og('og:image')).toHaveAttribute('content', /\/og\.png$/);
});
