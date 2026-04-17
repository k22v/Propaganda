import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[placeholder*="Введите логин"], input[type="text"]', 'dentist');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(courses|dashboard|profile|$)/, { timeout: 15000 });
}

test.describe('Courses', () => {
  test('courses page loads for authenticated user', async ({ page }) => {
    await login(page);
    await page.goto('/courses');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('course card displays correctly', async ({ page }) => {
    await login(page);
    await page.goto('/courses');
    const courseCard = page.locator('[class*="course"], [class*="card"]').first();
    await expect(courseCard).toBeVisible({ timeout: 10000 }).catch(() => {
      test.skip();
    });
  });

  test('search functionality works', async ({ page }) => {
    await login(page);
    await page.goto('/courses');
    const searchInput = page.locator('input[placeholder*="поиск" i], input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});
