import { test, expect } from '@playwright/test';

test('check for console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', exception => {
    errors.push(`Uncaught exception: "${exception}"`);
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);
  
  console.log('---ERRORS_START---');
  console.log(JSON.stringify(errors, null, 2));
  console.log('---ERRORS_END---');
});
