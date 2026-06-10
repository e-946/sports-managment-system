import { test, expect } from '@playwright/test';

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

test.describe('Moderator Permission & Restrictive Flow', () => {
  test('should register a Moderator as Admin, log in as Moderator, and verify correct restrictions', async ({ page }) => {
    // Generate unique random CPF and delegation name
    const randomCpf = generateValidCPF();
    const randomDelegation = `Canadá ${Math.floor(Math.random() * 1000)}`;

    // Add console listeners
    page.on('console', msg => console.log('MODERATOR-FLOW BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('MODERATOR-FLOW BROWSER EXCEPTION:', err.message));

    // 1. Log in as Admin to create a Delegation and a Moderator participant
    await page.goto('/login');
    await page.fill('input[placeholder*="Digite seu CPF"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Create Delegation
    await page.click('aside a[href="/admin/delegacoes"]');
    await page.fill('input[placeholder*="Ex: Polo Norte"]', randomDelegation);
    await page.click('button:has-text("Cadastrar")');
    await expect(page.locator('table')).toContainText(randomDelegation);

    // Create Moderator Participant (CPF: randomCpf, Tipo: MODERADOR)
    await page.click('aside a[href="/admin/participantes"]');
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('Moderador Canadá'); // Nome Completo
    await textInputs.nth(1).fill('Mod-Canadá');       // Nome Abreviado
    await textInputs.nth(2).fill(randomCpf);          // CPF
    await textInputs.nth(3).fill('11988888888');      // Celular
    await page.fill('input[type="date"]', '1985-05-15'); // Data Nascimento
    
    // Select Option using a highly reliable tag/order selector
    // Index 0: Sexo
    // Index 1: Tipo Usuário (MODERADOR)
    // Index 2: Delegação (Canadá)
    const selects = page.locator('select');
    await selects.nth(1).selectOption({ value: 'MODERADOR' }); // Tipo Usuário is index 1
    await selects.nth(2).selectOption({ label: randomDelegation }); // Delegação is index 2

    await page.click('button:has-text("Cadastrar Participante")');
    await expect(page.locator('table')).toContainText('Mod-Canadá');

    // Log out Admin (Wait briefly for DOM stability)
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 2. Log in as the newly created Moderator (CPF/Senha = randomCpf)
    await page.fill('input[placeholder*="Digite seu CPF"]', randomCpf);
    await page.fill('input[type="password"]', randomCpf);
    await page.click('button[type="submit"]');

    // Verify redirected and sidebar says "Moderador"
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('aside')).toContainText('Moderador');

    // Verify that links like "Usuários", "Delegações", "Esportes", "Partidas" are HIDDEN in the sidebar for Moderator
    await expect(page.locator('aside')).not.toContainText('Usuários');
    await expect(page.locator('aside')).not.toContainText('Delegações');
    await expect(page.locator('aside')).not.toContainText('Esportes');
    await expect(page.locator('aside')).not.toContainText('Partidas');

    // 3. Try to access protected routes anyway (should redirect to /admin)
    await page.goto('/admin/usuarios');
    await expect(page).toHaveURL(/\/admin/);

    await page.goto('/admin/partidas');
    await expect(page).toHaveURL(/\/admin/);

    // 4. Log out
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login/);
  });
});
