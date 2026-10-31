import { test, expect } from '@playwright/test';

// El clic en un link de afiliado manda el beacon a /api/clic y abre Mercado Libre tal cual, sin esperar al beacon.
// Todo interceptado: nunca sale a Mercado Libre y el preview no tiene functions/.
test('clic en el link de afiliado: beacon con modelo y lugar, y el link abre sin cambios', async ({ page, context }) => {
  await context.route((url) => url.hostname !== 'localhost', (r) => r.fulfill({ contentType: 'text/html', body: '<title>Simulado</title>' }));
  const beacons: unknown[] = [];
  await context.route('**/api/clic', (r) => {
    // Origin: el endpoint rechaza (403) lo que no venga del propio sitio, así que el beacon tiene que mandarlo.
    const { origin } = r.request().headers();
    beacons.push({ method: r.request().method(), origin, body: JSON.parse(r.request().postData() ?? 'null') });
    return r.fulfill({ status: 204 });
  });

  await page.goto('/scooter/segway-e3-pro/');
  const link = page.getByRole('link', { name: 'Ver en Mercado Libre' });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^https:\/\/meli\.la\//);

  const [pestaña] = await Promise.all([context.waitForEvent('page'), link.click()]);
  await pestaña.waitForLoadState('domcontentloaded');
  expect(pestaña.url()).toBe(href);
  const origin = new URL(page.url()).origin;
  await expect.poll(() => beacons).toEqual([{ method: 'POST', origin, body: { slug: 'segway-e3-pro', lugar: 'ficha' } }]);
});
