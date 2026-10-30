import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Add every new page here so it gets the same UX/a11y checks.
const PAGES = [
  '/',
  '/aviso-de-privacidad',
  '/como-ganamos-dinero',
  '/404',
  '/comparar',
  '/como-puntuamos',
  '/scooter/xiaomi-electric-scooter-5',
  '/scooter/segway-ninebot-max-g2',
];
const WIDTHS = [375, 768, 1280];
const SCHEMES = ['light', 'dark'] as const;

for (const path of PAGES) {
  for (const scheme of SCHEMES) {
    for (const width of WIDTHS) {
      test.describe(`${path} · ${scheme} · ${width}px`, () => {
        // Reduced motion so checks see the final state, not a mid-animation frame.
        test.use({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });

        test('no horizontal scroll', async ({ page }) => {
          await page.goto(path);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow).toBeLessThanOrEqual(0);
        });

        test('no serious accessibility violations (WCAG 2.2 AA)', async ({ page }) => {
          await page.goto(path);
          const { violations } = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();
          const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
          expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
        });

        test('buttons are at least 44px tall, links at least 24px', async ({ page }) => {
          await page.goto(path);
          const small = await page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>('a[href], button')]
              .filter((el) => el.offsetParent !== null && !el.closest('p'))
              .map((el) => ({
                el: (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40),
                h: el.getBoundingClientRect().height,
                min: el.tagName === 'BUTTON' || el.classList.contains('btn') ? 44 : 24,
              }))
              .filter((x) => x.h < x.min),
          );
          expect(small).toEqual([]);
        });
      });
    }
  }
}

test('theme toggle switches and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: /modo claro u oscuro/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  await toggle.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar menú' }).click();
  await expect(page.locator('#mobile-menu')).toBeHidden();
});
