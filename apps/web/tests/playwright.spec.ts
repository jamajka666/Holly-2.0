import { test, expect } from '@playwright/test';

// Smoke test: open Devices, open Details drawer, click "Speak: Ping this device"
// Assumes dev server is running at http://localhost:5173

test('devices drawer speak -> ping', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Navigate to /devices
  await page.click('a[href="/devices"]');
  await page.waitForURL('**/devices');

  // Wait for table rows
  await page.waitForSelector('table');

  // Intercept ping POSTs
  let pingCalled = false;
  await page.route('**/api/devices/*/ping', async (route) => {
    pingCalled = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  // Click first Details button
  const details = await page.$$('button:has-text("Details")');
  expect(details.length).toBeGreaterThan(0);
  await details[0].click();

  // Drawer should open with Speak button
  await page.waitForSelector('text=Speak: Ping this device');
  await page.click('text=Speak: Ping this device');

  // Wait a short moment for routed request
  await page.waitForTimeout(500);
  expect(pingCalled).toBe(true);
});
