import { test, expect } from '@playwright/test';

test.describe('Admin Geral Workflow Journey', () => {
  test('should create delegation, sport, participant, team, and log out successfully', async ({ page }) => {
    // Generate unique random CPF, sport name, team name, and unique date to prevent E2E collision
    const randomCpf = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    const randomSportName = `Basquete E2E ${Math.floor(Math.random() * 1000)}`;
    const randomTeamName = `Alemanha Gold ${Math.floor(Math.random() * 1000)}`;
    const randomDate = `2026-07-${String(10 + Math.floor(Math.random() * 18))}`;
    const randomDelegationName = `Alemanha E2E ${Math.floor(Math.random() * 1000)}`;
    const randomPartName = `Dirk ${Math.floor(Math.random() * 1000)}`;

    // Add console listeners
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    // 1. Log in
    await page.goto('/login');
    await page.fill('input[placeholder*="Digite seu CPF"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Verify Admin Dashboard redirect
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('aside')).toContainText('Admin Geral');

    // 2. Create Delegation
    await page.click('aside a[href="/admin/delegacoes"]');
    await expect(page).toHaveURL(/\/admin\/delegacoes/);
    await page.fill('input[placeholder*="Ex: Polo Norte"]', randomDelegationName);
    await page.click('button:has-text("Cadastrar")');
    // Verify list contains created delegation
    await expect(page.locator('table')).toContainText(randomDelegationName);

    // 3. Create Sport
    await page.click('aside a[href="/admin/esportes"]');
    await expect(page).toHaveURL(/\/admin\/esportes/);
    await page.fill('input[placeholder*="Ex: Futebol"]', randomSportName);
    await page.fill('input[type="date"]', randomDate);
    
    // Set Min. Part. and Máx. Part. to 1 to make team forming simple
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('1');
    await numberInputs.nth(1).fill('1');

    await page.click('button:has-text("Cadastrar Esporte")');
    await expect(page.locator('table')).toContainText(randomSportName);

    // 4. Create Participant
    await page.click('aside a[href="/admin/participantes"]');
    await expect(page).toHaveURL(/\/admin\/participantes/);
    
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('Dirk Nowitzki'); // Nome Completo
    await textInputs.nth(1).fill(randomPartName);  // Nome Abreviado
    await textInputs.nth(2).fill(randomCpf);       // CPF
    await textInputs.nth(3).fill('11999999999');   // Celular
    await page.fill('input[type="date"]', '1978-06-19'); // Data Nascimento

    // Select Delegation
    await page.selectOption(`select:has-text("${randomDelegationName}")`, { label: randomDelegationName });

    await page.click('button:has-text("Cadastrar Participante")');
    await expect(page.locator('table')).toContainText(randomPartName);

    // 5. Create Team
    await page.click('aside a[href="/admin/equipes"]');
    await expect(page).toHaveURL(/\/admin\/equipes/);
    
    await page.fill('input[placeholder*="Ex: Dupla Dinâmica"]', randomTeamName);
    
    // Select sport
    await page.selectOption('select:has-text("Basquete")', { label: `${randomSportName} (MASCULINO) - Min: 1 Max: 1` });
    
    // Select delegation
    await page.selectOption(`select:has-text("${randomDelegationName}")`, { label: randomDelegationName });

    // Check specifically our newly created Dirk participant label to avoid collision
    await page.click(`label:has-text("${randomPartName}")`);

    await page.click('button:has-text("Formar Equipe")');
    await expect(page.locator('table')).toContainText(randomTeamName);

    // 6. Log out
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login/);
  });
});
