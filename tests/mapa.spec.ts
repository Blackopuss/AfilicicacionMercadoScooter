import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const lugar = (lon: number, lat: number, properties: Record<string, string>) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties: { countrycode: 'MX', state: 'Ciudad de México', ...properties },
});
const ZOCALO = [
  lugar(-99.1332, 19.4326, { name: 'Zócalo', street: 'Plaza de la Constitución', locality: 'Centro', city: 'Ciudad de México' }),
  lugar(-99.1335, 19.4342, { name: 'Catedral Metropolitana', street: 'Plaza de la Constitución', housenumber: 's/n', city: 'Ciudad de México' }),
  // Fuera de México: no debe aparecer.
  lugar(-90.51, 14.64, { name: 'Zócalo de Guatemala', countrycode: 'GT', state: 'Guatemala' }),
];
const COYOACAN = [lugar(-99.1625, 19.3467, { name: 'Coyoacán', district: 'Coyoacán' })];

// Las pruebas no salen a internet: Photon responde con datos fijos y todo lo demás externo se corta.
async function conPhoton(page: Page, { retrasoMs = 0 } = {}) {
  const pedidas: string[] = [];
  await page.route((url) => url.hostname !== 'localhost', (r) => r.abort());
  await page.route('https://photon.komoot.io/api/**', async (r) => {
    const q = new URL(r.request().url()).searchParams.get('q') ?? '';
    pedidas.push(q);
    if (retrasoMs) await new Promise((ok) => setTimeout(ok, retrasoMs));
    const features = /zóc/i.test(q) ? ZOCALO : /coyo/i.test(q) ? COYOACAN : [];
    await r.fulfill({ json: { type: 'FeatureCollection', features } });
  });
  return pedidas;
}

test.use({ viewport: { width: 375, height: 800 } });

test('escribir sugiere direcciones; flechas + Enter elige, Escape cierra', async ({ page }) => {
  const pedidas = await conPhoton(page);
  await page.goto('/mapa');
  await page.waitForTimeout(400);
  expect(pedidas).toEqual([]); // nada al cargar

  const desde = page.getByRole('combobox', { name: 'Desde' });
  await desde.fill('Zó');
  await page.waitForTimeout(400);
  expect(pedidas).toEqual([]); // menos de 3 letras

  await desde.fill('Zócalo');
  const opciones = page.getByRole('listbox', { name: 'Sugerencias para Desde' }).getByRole('option');
  await expect(opciones).toHaveCount(2);
  expect(pedidas).toEqual(['Zócalo']);
  await expect(desde).toHaveAttribute('aria-expanded', 'true');
  await expect(opciones.first()).toContainText('Zócalo');
  await expect(opciones.first()).toContainText('Plaza de la Constitución, Centro, Ciudad de México');
  expect((await opciones.first().boundingBox())!.height).toBeGreaterThanOrEqual(44);

  await desde.press('ArrowDown');
  await desde.press('ArrowDown');
  await expect(desde).toHaveAttribute('aria-activedescendant', 'desde-op-1');
  await expect(opciones.nth(1)).toHaveAttribute('aria-selected', 'true');
  await desde.press('Enter');
  await expect(desde).toHaveValue('Catedral Metropolitana, Plaza de la Constitución s/n, Ciudad de México');
  await expect(desde).toHaveAttribute('aria-expanded', 'false');
  await expect(opciones.first()).toBeHidden();

  const hasta = page.getByRole('combobox', { name: 'Hasta' });
  await hasta.fill('Coyoacán');
  const opcionHasta = page.getByRole('listbox', { name: 'Sugerencias para Hasta' }).getByRole('option');
  await expect(opcionHasta).toHaveCount(1);
  await hasta.press('Escape');
  await expect(hasta).toHaveAttribute('aria-expanded', 'false');
  await expect(opcionHasta).toBeHidden();

  // Con el teclado se vuelve a abrir; el clic (o toque) también elige.
  await hasta.press('ArrowDown');
  await opcionHasta.click();
  await expect(hasta).toHaveValue('Coyoacán, Ciudad de México');

  // Sin token de Mapbox (el preview no tiene functions/) la distancia se estima y se dice.
  const antes = pedidas.length;
  await page.getByRole('button', { name: 'Calcular ruta' }).click();
  await expect(page.locator('#estado-ruta')).toContainText(/Distancia estimada: unos \d+(\.\d)? km \(línea recta × 1\.3/);
  await expect(page.locator('#resumen')).toContainText('Trayecto estimado de unos');
  expect(pedidas.length).toBe(antes); // las coordenadas elegidas ya estaban guardadas
});

test('muestra "Buscando…" y "Sin resultados"', async ({ page }) => {
  await conPhoton(page, { retrasoMs: 600 });
  await page.goto('/mapa');
  const desde = page.getByRole('combobox', { name: 'Desde' });
  await desde.fill('xyzw');
  await expect(page.locator('[data-estado]', { hasText: 'Buscando…' })).toBeVisible();
  await expect(page.locator('[data-estado]', { hasText: 'Sin resultados.' })).toBeVisible();
  await expect(desde).toHaveAttribute('aria-expanded', 'false');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`lista abierta sin violaciones serias de accesibilidad (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await conPhoton(page);
    await page.goto('/mapa');
    const desde = page.getByRole('combobox', { name: 'Desde' });
    await desde.fill('Zócalo');
    await expect(page.getByRole('option')).toHaveCount(2);
    await desde.press('ArrowDown');
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serias = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serias.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });
}

test('sin API de rutas, el cálculo por km da el mismo resultado', async ({ page }) => {
  await conPhoton(page);
  await page.goto('/mapa');

  // Texto escrito sin elegir sugerencia: se toma la primera de Photon y se estima.
  const hasta = page.getByRole('combobox', { name: 'Hasta' });
  await page.getByRole('combobox', { name: 'Desde' }).fill('Zócalo, CDMX');
  await hasta.fill('Coyoacán, CDMX');
  await expect(page.getByRole('option')).toHaveCount(1);
  await hasta.press('Escape'); // la lista abierta tapa el botón
  await page.getByRole('button', { name: 'Calcular ruta' }).click();
  await expect(page.locator('#estado-ruta')).toContainText('Distancia estimada');

  await hasta.fill('xyzw sin resultados');
  await expect(page.locator('[data-estado]', { hasText: 'Sin resultados.' })).toBeVisible();
  await hasta.press('Escape');
  await page.getByRole('button', { name: 'Calcular ruta' }).click();
  await expect(page.locator('#estado-ruta')).toContainText('No encontramos “xyzw sin resultados” en México');

  const lista = page.locator('#lista li');
  const total = await lista.count();
  expect(total).toBeGreaterThan(0);

  await page.getByLabel('Km por trayecto').fill('5');
  await page.keyboard.press('Enter');
  await expect(page.locator('#resumen')).toContainText(`Trayecto de 5 km: llegan ${total} de ${total} scooters.`);
  await expect(lista.first()).toContainText('Llega: le sobra');
  await expect(lista.first().getByRole('link')).toHaveAttribute('href', /^\/scooter\/[a-z0-9-]+$/);

  // Ida y vuelta duplica la distancia; 500 km no los aguanta ningún scooter.
  await page.getByLabel('Km por trayecto').fill('500');
  await page.getByRole('button', { name: 'Calcular con mis km' }).click();
  await page.getByLabel('Ida y vuelta sin cargar').check();
  await expect(page.locator('#resumen')).toContainText(`Trayecto de 1,000 km (ida y vuelta): llegan 0 de ${total}`);
  await expect(lista.first()).toContainText('No llega: le faltan');

  await page.getByLabel('Km por trayecto').fill('0');
  await page.keyboard.press('Enter');
  await expect(page.locator('#estado-km')).toContainText('Escribe una distancia');
});
