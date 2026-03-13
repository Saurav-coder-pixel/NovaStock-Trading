const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log("Navigating to crypto...");
    // The sidebar links have text
    await page.waitForTimeout(1000);
    await page.click('text=Crypto Exchange');
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log("Script error:", e.message);
  }

  await browser.close();
})();
