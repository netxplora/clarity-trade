import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log('PAGE EXCEPTION:', exception));
  
  console.log('Navigating to http://localhost:8082/ ...');
  await page.goto('http://localhost:8082/', { waitUntil: 'networkidle' });
  
  console.log('Navigation complete. Waiting a bit to capture logs...');
  await page.waitForTimeout(2000);
  
  console.log('Content snippet:');
  const content = await page.content();
  console.log(content.substring(0, 500));
  console.log('Root innerHTML:');
  console.log(await page.evaluate(() => document.getElementById('root')?.innerHTML?.substring(0, 500)));
  
  await browser.close();
})();
