import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to local app...');
    await page.goto('http://localhost:3002/');
    await page.waitForTimeout(2000);
    
    console.log('Clicking the Crypto Exchange nav item...');
    await page.click('text="Crypto Exchange"');
    
    await page.waitForTimeout(4000); // Wait for API and rendering
    
    // Check if the page is rendering lists or crashing completely
    const isError = await page.evaluate(() => {
        // A black screen often means no content in root or an error boundary showing.
        // Let's check if the crypto list container or sparklines exist.
        const rootContent = document.getElementById('root')?.innerHTML || '';
        return rootContent.includes('Crypto Auto-Pilot AI') || rootContent.includes('Nova Crypto Exchange');
    });

    if (isError) {
        console.log('SUCCESS: Crypto Dashboard rendered cleanly! Found the UI elements.');
    } else {
        const text = await page.evaluate(() => document.body.innerText);
        console.log('FAILED: UI might have crashed. Text found:', text.substring(0, 500));
    }
    
  } catch (error) {
    console.error('Playwright Test Error:', error);
  } finally {
    await browser.close();
  }
})();
