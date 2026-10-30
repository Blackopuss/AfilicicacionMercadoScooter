import { test, expect } from '@playwright/test';

// El preview local no tiene functions/: /api/* responde 404, igual que si el proveedor de rutas estuviera caído.
test('sin API de rutas, el cálculo por km da el mismo resultado', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/mapa');

  await page.getByLabel('Desde').fill('Zócalo, CDMX');
  await page.getByLabel('Hasta').fill('Coyoacán, CDMX');
  await page.getByRole('button', { name: 'Calcular ruta' }).click();
  await expect(page.locator('#estado-ruta')).toContainText('no está disponible');
  await expect(page.getByLabel('Km por trayecto')).toBeFocused();

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
