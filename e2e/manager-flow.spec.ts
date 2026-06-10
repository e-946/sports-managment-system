import { test, expect } from '@playwright/test';

function formatCPF(value: string): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 4) return value;
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

function generateValidCPF(): string {
  const num = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += num[i] * (10 - i);
  }
  let d1 = (sum * 10) % 11;
  if (d1 >= 10) d1 = 0;
  
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += num[i] * (11 - i);
  }
  sum += d1 * 2;
  let d2 = (sum * 10) % 11;
  if (d2 >= 10) d2 = 0;
  
  const cpf = [...num, d1, d2].join('');
  if (/^(\d)\1{10}$/.test(cpf)) {
    return generateValidCPF();
  }
  return cpf;
}

test.describe('Manager Creation & Navigation Flow', () => {
  test('should create a Manager user as Admin, log in as Manager, and verify correct view access', async ({ page }) => {
    // Generate unique random CPF to prevent test collisions
    const randomCpf = generateValidCPF();

    // Add console listeners
    page.on('console', msg => console.log('MANAGER-FLOW BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('MANAGER-FLOW BROWSER EXCEPTION:', err.message));

    // 1. Log in as Admin Geral
    await page.goto('/login');
    await page.fill('input[placeholder*="Digite seu CPF"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);

    // 2. Navigate to Users Panel
    await page.click('aside a[href="/admin/usuarios"]');
    await expect(page).toHaveURL(/\/admin\/usuarios/);

    // 3. Fill the User creation form
    // Locators:
    // Nome input is type="text", CPF input is type="text"
    // Password input is type="password"
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('Gerente Geral E2E'); // Nome
    await textInputs.nth(1).fill(randomCpf);           // CPF
    await page.fill('input[type="password"]', 'managerpassword'); // Senha

    // Select Role as MANAGER
    await page.selectOption('select', { value: 'MANAGER' });

    // Assert that delegation select is NOT visible (since role is MANAGER)
    await expect(page.locator('select:has-text("Selecione a Delegação")')).toHaveCount(0);

    // Submit user creation
    await page.click('button:has-text("Cadastrar Usuário")');

    // 4. Verify that the table lists our new Manager
    await expect(page.locator('table')).toContainText('Gerente Geral E2E');
    await expect(page.locator('table')).toContainText(formatCPF(randomCpf));

    // Log out Admin
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login/);

    // 5. Authenticate as the newly created Manager
    await page.fill('input[placeholder*="Digite seu CPF"]', randomCpf);
    await page.fill('input[type="password"]', 'managerpassword');
    await page.click('button[type="submit"]');

    // Verify redirected and sidebar says "Manager"
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('aside')).toContainText('Manager');

    // Managers can see Delegações, Esportes, Partidas, but NOT Usuários in the sidebar
    await expect(page.locator('aside')).not.toContainText('Usuários');
    await expect(page.locator('aside')).toContainText('Delegações');
    await expect(page.locator('aside')).toContainText('Esportes');
    await expect(page.locator('aside')).toContainText('Partidas');

    // Log out Manager
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login/);
  });
});
