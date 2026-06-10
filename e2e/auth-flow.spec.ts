import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation Flow', () => {
  test('should log in as Admin and navigate to Delegacoes', async ({ page }) => {
    // 1. Navigate to Login Page
    await page.goto('/login');

    // 2. Validate login page rendering
    await expect(page.locator('h2')).toContainText('Acesso Restrito');
    
    // 3. Fill out and submit login form
    await page.fill('input[placeholder*="Digite seu CPF"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    
    // Click submit button
    await page.click('button[type="submit"]');

    // 4. Verify successful authentication and redirection to Admin Dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('aside')).toContainText('Admin Geral');
    await expect(page.locator('main')).toContainText('Status Geral');

    // 5. Navigate to Delegacoes via sidebar link
    await page.click('aside a[href="/admin/delegacoes"]');

    // 6. Verify navigation to Delegacoes management page
    await expect(page).toHaveURL(/\/admin\/delegacoes/);
    await expect(page.locator('main')).toContainText('Delegações');
  });
});
