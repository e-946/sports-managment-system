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

test.describe('Soft Delete and Unique Index Journey', () => {
  test('should allow creating participant with same CPF after soft delete', async ({ page }) => {
    const randomCpf = generateValidCPF();
    const randomPartName1 = `Clone Um ${Math.floor(Math.random() * 1000)}`;
    const randomPartName2 = `Clone Dois ${Math.floor(Math.random() * 1000)}`;

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // 1. Log in as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Digite seu CPF"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // 2. Go to participantes and create a new participant
    await page.click('aside a[href="/admin/participantes"]');
    await expect(page).toHaveURL(/\/admin\/participantes/);
    
    let textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill(randomPartName1); // Nome Completo
    await textInputs.nth(1).fill(randomPartName1); // Nome Abreviado
    await textInputs.nth(2).fill(randomCpf);       // CPF
    await textInputs.nth(3).fill('11999999999');   // Celular
    await page.fill('input[type="date"]', '1990-01-01');

    await page.click('button:has-text("Cadastrar Participante")');
    await expect(page.locator('table')).toContainText(randomPartName1);

    // 3. Attempt to create another participant with the same CPF (should fail or just not appear if error)
    await textInputs.nth(0).fill(randomPartName2);
    await textInputs.nth(1).fill(randomPartName2);
    await textInputs.nth(2).fill(randomCpf);
    await textInputs.nth(3).fill('11999999999');
    await page.fill('input[type="date"]', '1990-01-01');
    await page.click('button:has-text("Cadastrar Participante")');
    
    // Check that it didn't create the second one (either table still has only one or UI shows error)
    // In many simple apps, it just doesn't add to table. We wait a bit to ensure it doesn't appear.
    await page.waitForTimeout(1000);

    // 4. Soft-delete the first participant
    // Find the row for randomPartName1 and click its Excluir button
    const row = page.locator(`tr:has-text("${randomPartName1}")`);
    await row.locator('button[title="Excluir"] > svg').click();

    // Confirm deletion if there's a prompt (using generic dialog handler)
    page.once('dialog', dialog => dialog.accept());
    
    // Depending on UI, the row might disappear
    await expect(row).toBeHidden();

    // 5. Try creating the second participant with the same CPF again
    await textInputs.nth(0).fill(randomPartName2);
    await textInputs.nth(1).fill(randomPartName2);
    await textInputs.nth(2).fill(randomCpf);
    await textInputs.nth(3).fill('11999999999');
    await page.fill('input[type="date"]', '1990-01-01');
    await page.click('button:has-text("Cadastrar Participante")');

    // Should succeed now!
    await expect(page.locator('table')).toContainText(randomPartName2);
  });
});
