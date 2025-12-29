const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Open auth modal
    await page.click('.sign-in-btn');
    await page.waitForSelector('#signInPanel', { visible: true });

    // Fill wrong credentials to trigger inline error
    await page.type('#signUsername', 'nonexistent_user');
    await page.type('#signPassword', 'wrongpassword');

    // Submit the form
    await page.click('#signInPanel form button[type=submit]');

    // Wait for the inline error to appear
    await page.waitForFunction(() => {
      const el = document.getElementById('signinError');
      return el && el.style.display !== 'none' && el.textContent.trim().length > 0;
    }, { timeout: 7000 });

    // Capture error text
    const errorText = await page.$eval('#signinError', el => el.textContent.trim());
    console.log('Inline error text:', errorText);

    // Take screenshot
    const out = '/tmp/braniac-auth-error.png';
    await page.screenshot({ path: out, fullPage: false });
    console.log('Screenshot saved to', out);
  } catch (err) {
    console.error('Test failed:', err);
    // Save screenshot on failure
    try {
      const out = '/tmp/braniac-auth-error-failure.png';
      await page.screenshot({ path: out, fullPage: false });
      console.log('Failure screenshot saved to', out);
    } catch (e) {}
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
