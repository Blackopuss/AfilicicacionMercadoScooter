import { test, expect } from '@playwright/test';

// Sin sesión aal2 no puede haber ni un dato ni un formulario de precios en la página.
test('/admin sin sesión no muestra datos', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  // Sin variables (CI) pide configurar; con variables, pide el correo.
  await expect(page.getByText(/Configura Supabase|Tu correo/).first()).toBeVisible();
  await expect(page.locator('input[name="precio"]')).toHaveCount(0);
  await expect(page.locator('[data-slug], [data-ultimo]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Guardar|Publicar/ })).toHaveCount(0);
  await expect(page.getByText(/Segway|iScooter|Honey Whale|\$\d/)).toHaveCount(0);
});
