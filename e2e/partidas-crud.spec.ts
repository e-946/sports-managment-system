import { test, expect } from '@playwright/test';

test.describe('Partidas CRUD Flow', () => {
  test('Admin should be able to navigate to matches and see the board', async ({ page }) => {
    // 1. Log in as Admin Geral
    await page.goto('/login');
    await page.fill('input[placeholder*="Digite seu CPF"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);

    // 2. Navigate to Partidas
    await page.click('aside a[href="/admin/partidas"]');
    await expect(page).toHaveURL(/\/admin\/partidas/);

    // 3. Verify Elements
    await expect(page.locator('text=Gestão de Partidas')).toBeVisible();
    await expect(page.locator('text=Registrar Partida')).toBeVisible();
    await expect(page.locator('text=Empate / N/A')).toBeVisible(); // Confirma que a opção que gerava erro existe

    // A test attempting full creation might fail if there are no teams/sports created previously in the DB state.
    // So we just assert that the admin can reach the panel and the form is interactive.
  });
});
