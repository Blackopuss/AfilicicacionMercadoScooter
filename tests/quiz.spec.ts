import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('recorre el quiz completo y muestra 3 resultados enlazables', async ({ page }) => {
  await page.goto('/quiz');
  await expect(page.getByRole('heading', { name: /Cuántos km/ })).toBeVisible();
  await page.getByRole('button', { name: 'Hasta 10 km' }).click();
  await expect(page.getByRole('heading', { name: '¿Cuánto pesas?' })).toBeFocused();
  // Atrás conserva la respuesta y Siguiente vuelve a avanzar
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page.getByRole('button', { name: 'Hasta 10 km' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Hasta 75 kg' }).click();
  await page.getByRole('button', { name: 'Sin límite' }).click();
  await page.getByRole('button', { name: 'No, casi plano' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  await page.getByRole('button', { name: /Sí, que sea plegable/ }).click();

  const tarjetas = page.locator('[data-lista] > li');
  await expect(tarjetas).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Tus 3 scooters' })).toBeFocused();
  await expect(tarjetas.first()).toContainText('Precio pendiente');
  await expect(tarjetas.first().getByRole('link')).toHaveAttribute('href', /^\/scooter\/[a-z0-9-]+$/);
  await expect(page).toHaveURL(/\/quiz\?d=10&p=75&b=sin&s=0&c=1$/);

  // El enlace compartido abre directo el mismo resultado
  const primero = await tarjetas.first().locator('h3').textContent();
  await page.goto(page.url());
  await expect(tarjetas.first().locator('h3')).toHaveText(primero!);
});

test('si nada cumple lo dice y marca los más cercanos', async ({ page }) => {
  await page.goto('/quiz?d=100&p=135&b=sin&s=1&c=0');
  await expect(page.getByRole('heading', { name: /Ninguno cumple todo/ })).toBeVisible();
  await expect(page.locator('[data-lista] > li')).toHaveCount(3);
  await expect(page.locator('[data-lista] [data-aviso]').first()).toHaveText('No llega');
});

test('parámetros inválidos en la URL no rompen la página', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto('/quiz?d=abc&p=-1&b=%3Cscript%3E&s=2&c=1&zz=1');
  await expect(page.getByRole('heading', { name: /Cuántos km/ })).toBeVisible();
  await page.goto('/quiz?d=99999&p=1e9&b=sin&s=1&c=0');
  await expect(page.getByRole('heading', { name: '¿Cuánto pesas?' })).toBeVisible();
  expect(errores).toEqual([]);
});

// Playwright sin JS no pinta <noscript> (el parser sigue en modo "scripting"), así que se revisa el HTML.
test('sin JavaScript explica que hace falta y enlaza al comparador', async ({ request }) => {
  const html = await (await request.get('/quiz')).text();
  expect(html).toMatch(/<noscript>.*El quiz necesita JavaScript.*href="\/comparar".*<\/noscript>/s);
  expect(html).toMatch(/<div[^>]*data-quiz[^>]*hidden/);
});
