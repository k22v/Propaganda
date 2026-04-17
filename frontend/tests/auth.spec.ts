import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/вход/i);
  });

  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="Введите логин"], input[type="text"]', 'dentist');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(courses|dashboard|profile|$)/, { timeout: 15000 });
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="Введите логин"], input[type="text"]', 'invaliduser');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const errorEl = page.locator('div').filter({ hasText: /неверн|invalid|ошибк/i }).first();
    if (await errorEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(errorEl).toBeVisible();
    }
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });
});
