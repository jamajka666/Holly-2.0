import { test, expect } from '@playwright/test';

test('ThemePreview snapshot', async ({ page }) => {
  await page.goto('http://localhost:5173/theme');
  await page.waitForSelector('h1');
  await page.screenshot({ path: 'theme-preview.png', fullPage: true });
  expect(await page.screenshot()).toMatchSnapshot('theme-preview.png');
});
