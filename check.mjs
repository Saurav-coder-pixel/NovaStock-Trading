import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.push(`Page Error: ${error.message}`);
  });

  try {
    console.log("Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Check if the current URL has any stock market link, or navigate to it directly
    // The stock market page is likely accessed via the Sidebar
    // Wait for the app to load
    await page.waitForSelector('text=NovaTrade', { timeout: 5000 }).catch(() => {});
    
    console.log("Clicking Market link...");
    // Attempt clicking 'Market' or 'Crypto'
    const marketLinks = await page.$$('text=Market');
    if (marketLinks.length > 0) {
      await marketLinks[0].click().catch(() => {});
      await page.waitForTimeout(2000);
    } else {
      console.log("Could not find Market text");
    }

    const cryptoLinks = await page.$$('text=Crypto');
    if (cryptoLinks.length > 0) {
      await cryptoLinks[0].click().catch(() => {});
      await page.waitForTimeout(2000);
    } else {
      console.log("Could not find Crypto text");
    }

    if (logs.length > 0) {
      console.log("ERRORS FOUND:");
      console.log(logs.join('\n'));
    } else {
      console.log("No console errors found.");
    }
    
  } catch (err) {
    console.error("Script Error:", err);
  } finally {
    await browser.close();
  }
})();
