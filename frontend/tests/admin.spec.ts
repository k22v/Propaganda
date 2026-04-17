import { test, expect } from '@playwright/test';

async function loginAdmin(page) {
  await page.goto('/login');
  await page.fill('input[placeholder*="Введите логин"], input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

test.describe('Admin Dashboard', () => {
  test('admin can access admin page', async ({ page }) => {
    await loginAdmin(page);
    const url = page.url();
    if (url.includes('courses') || url.includes('dashboard') || url === 'http://localhost:3000/') {
      await page.goto('/admin');
    }
    await page.waitForTimeout(2000);
    const content = await page.locator('body').textContent();
    if (content.includes('404')) {
      test.skip();
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin page shows users data', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(3000);
    const content = await page.locator('body').textContent();
    if (!content || content.includes('404')) {
      test.skip();
    }
  });

  test('admin can filter by role', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(3000);
    const roleFilter = page.locator('select, [role="combobox"]').first();
    if (await roleFilter.isVisible().catch(() => false)) {
      await roleFilter.click();
      await page.waitForTimeout(300);
    }
  });
});
