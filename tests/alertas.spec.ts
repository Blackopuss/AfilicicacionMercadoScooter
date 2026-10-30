import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Exit-intent simulado: el cursor sale por arriba de la ventana.
const salir = (page: Page) =>
  page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, bubbles: true })));

test.use({ reducedMotion: 'reduce' });

test('el popup de salida aparece una sola vez, se cierra con Esc y devuelve el foco', async ({ page }) => {
  await page.goto('/');
  const popup = page.getByRole('dialog', { name: 'Te avisamos cuando baje' });
  await expect(popup).toBeHidden();

  const tema = page.getByRole('button', { name: /modo claro u oscuro/ });
  await tema.focus();
  await salir(page);
  await expect(popup).toBeVisible();
  await expect(popup.getByLabel('Tu correo')).toBeVisible();
  await expect(popup.locator('a[href*="mercadolibre"]')).toHaveCount(0);

  // Foco atrapado: Tab nunca sale del diálogo.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await expect(tema).toBeFocused();

  // Ni en la misma página ni al volver (7 días).
  await salir(page);
  await expect(popup).toBeHidden();
  await page.goto('/quiz');
  await salir(page);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('el popup se cierra con su botón y con clic fuera', async ({ page }) => {
  await page.goto('/');
  await salir(page);
  const popup = page.getByRole('dialog');
  await popup.getByRole('button', { name: 'Cerrar' }).click();
  await expect(popup).toBeHidden();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await salir(page);
  await expect(popup).toBeVisible();
  await page.mouse.click(5, 5); // fondo (backdrop)
  await expect(popup).toBeHidden();
});

for (const colorScheme of ['light', 'dark'] as const) {
  for (const width of [375, 1280]) {
    test(`el popup abierto es accesible · ${colorScheme} · ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.evaluate(() => document.querySelector<HTMLDialogElement>('[data-alerta-popup]')!.showModal());
      const popup = page.getByRole('dialog', { name: 'Te avisamos cuando baje' });
      await expect(popup).toBeVisible();
      await expect(popup.getByRole('checkbox', { name: /Acepto recibir correos/ })).toHaveAttribute('required', '');
      await expect(popup.getByRole('link', { name: 'aviso de privacidad' })).toHaveAttribute('href', '/aviso-de-privacidad');
      const { violations } = await new AxeBuilder({ page })
        .include('[data-alerta-popup]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test('en móvil aparece tras scroll profundo', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 700 }, hasTouch: true, isMobile: true });
  await page.goto('/quiz?d=10&p=75&b=sin&s=0&c=1');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.close();
});

test('no aparece en el aviso de privacidad ni en /admin', async ({ page }) => {
  for (const path of ['/aviso-de-privacidad', '/admin']) {
    await page.goto(path);
    await expect(page.locator('[data-alerta-popup]')).toHaveCount(0);
  }
});
