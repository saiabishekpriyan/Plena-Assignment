import { chromium } from 'playwright';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

(async () => {
  const downloadPath = process.env.CSV_DOWNLOAD_PATH || './data/babyNames.csv';
  const email = process.env.KAGGLE_EMAIL;

  if (!email) {
    console.error("Set KAGGLE_EMAIL in .env if you want to auto-fill email.");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    console.log("Opening Kaggle login page...");
    await page.goto('https://www.kaggle.com/account/login', { waitUntil: 'domcontentloaded' });
    console.log("Current URL after navigation:", page.url());

    // Click "Continue with Email" if it exists
    const continueEmailButton = page.locator('text=Continue with Email');
    if (await continueEmailButton.count() > 0) {
      console.log("Clicking 'Continue with Email'...");
      await continueEmailButton.click();
      await page.waitForTimeout(2000); // wait for transition
    }

    // Fill email only
    const emailInput = page.locator('input[name="username"], input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await emailInput.fill(email);
    console.log("Email entered.");

    // Manual login for password
    console.log("Please enter your password manually and complete login in the browser...");

    // Wait until Kaggle user avatar is visible (indicating successful login)
    const userAvatar = page.locator('img[alt*="profile"]');
    await userAvatar.waitFor({ state: 'visible', timeout: 300000 }); // wait up to 5 minutes
    console.log("Login detected, continuing...");

    // Navigate to dataset page
    const datasetURL = 'https://www.kaggle.com/datasets/thedevastator/us-baby-names-by-year-of-birth';
    await page.goto(datasetURL, { waitUntil: 'domcontentloaded' });
    console.log("Navigated to dataset page.");

    // Click the "Data" tab
    const dataTab = page.locator('a[data-tab="data"], text=Data');
    await dataTab.waitFor({ state: 'visible', timeout: 15000 });
    await dataTab.click();
    await page.waitForTimeout(3000);

    // Find CSV link
    const csvLink = await page.$('a[href*="babyNamesUSYOB-full.csv"]');
    if (!csvLink) {
      console.warn("CSV link not found. You may need to download manually.");
      return;
    }

    // Download CSV
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      csvLink.click()
    ]);

    const filePath = path.resolve(downloadPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    await download.saveAs(filePath);
    console.log("✅ CSV downloaded to:", filePath);

  } catch (err) {
    console.error("❌ Automation failed. You may need to download CSV manually.\n", err);
  } finally {
    await browser.close();
  }
})();
