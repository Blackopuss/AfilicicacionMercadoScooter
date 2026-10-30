import { test, expect, type Page } from '@playwright/test';

const TOTAL = 16;
const filas = (page: Page) => page.locator('tbody[data-lista] > tr:visible');
const valores = (page: Page, attr: string) =>
  filas(page).evaluateAll((els, a) => els.map((el) => el.getAttribute(a)!), attr);

test.describe('/comparar en escritorio', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('filtra por plegable, categoría y peso', async ({ page }) => {
    await page.goto('/comparar');
    await expect(filas(page)).toHaveCount(TOTAL);

    await page.getByLabel('Solo plegables').check();
    expect(await valores(page, 'data-plegable')).not.toContain('false');

    await page.getByLabel('Categoría').selectOption('todoterreno');
    for (const c of await valores(page, 'data-categorias')) expect(c).toContain('todoterreno');

    await page.getByLabel('Solo plegables').uncheck();
    await page.getByLabel('Categoría').selectOption('');
    await page.getByLabel('Peso máximo del scooter (kg)').fill('16');
    const pesos = (await valores(page, 'data-peso')).map(Number);
    expect(pesos.length).toBeGreaterThan(0);
    expect(pesos.length).toBeLessThan(TOTAL);
    for (const p of pesos) expect(p).toBeLessThanOrEqual(16);
    await expect(page.locator('[data-conteo]')).toHaveText(`${pesos.length} modelos`);
  });

  test('ordena por peso y recalcula la autonomía real con tu peso', async ({ page }) => {
    await page.goto('/comparar');
    await page.getByLabel('Ordenar por').selectOption('peso');
    const pesos = (await valores(page, 'data-peso')).map(Number);
    expect(pesos).toEqual([...pesos].sort((a, b) => a - b));

    const real = filas(page).first().locator('[data-real]');
    const antes = Number(await real.textContent());
    await page.getByLabel('Tu peso (kg)').fill('120');
    await expect(real).not.toHaveText(String(antes));
    expect(Number(await real.textContent())).toBeLessThan(antes);
  });

  test('selecciona dos y los compara con ?m=', async ({ page }) => {
    await page.goto('/comparar');
    await page.getByRole('checkbox', { name: 'Comparar Xiaomi Electric Scooter 5' }).check();
    await page.getByRole('checkbox', { name: 'Comparar Segway-Ninebot Max G2' }).check();
    await page.getByRole('button', { name: 'Comparar (2)' }).click();
    await expect(page).toHaveURL(/\?m=xiaomi-electric-scooter-5,segway-ninebot-max-g2/);
    await expect(page.locator('#lado-a-lado')).toBeVisible();
  });

  test('un enlace ?m= abre la vista lado a lado con el ganador marcado', async ({ page }) => {
    await page.goto('/comparar?m=xiaomi-electric-scooter-5,segway-ninebot-max-g2,no-existe');
    const vista = page.locator('#lado-a-lado');
    await expect(vista).toBeVisible();
    await expect(vista.locator('thead th:visible')).toHaveCount(2);
    await expect(vista.locator('td[data-gana]').first()).toBeVisible();
    // Más ligero gana en peso.
    const peso = vista.locator('tr', { hasText: 'Peso del scooter' });
    await expect(peso.locator('td[data-gana]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Comparar (2)' })).toBeVisible();
  });
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });

  test('/comparar muestra la lista completa', async ({ page }) => {
    await page.goto('/comparar');
    await expect(page.locator('ul[data-lista] > li:visible')).toHaveCount(TOTAL);
  });
});

test('la ficha recalcula la autonomía real con tu peso y subidas', async ({ page }) => {
  await page.goto('/scooter/xiaomi-electric-scooter-5');
  const km = page.locator('[data-km-real]');
  const base = Number(await km.textContent());
  await page.getByLabel('Tu peso (kg)').fill('110');
  await expect(km).not.toHaveText(String(base));
  const conPeso = Number(await km.textContent());
  expect(conPeso).toBeLessThan(base);
  await page.getByLabel('Con subidas').check();
  expect(Number(await km.textContent())).toBeLessThan(conPeso);
  await expect(page.locator('#historial')).toContainText('Historial de precios próximamente');
});
