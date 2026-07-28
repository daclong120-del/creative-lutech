import { chromium } from "playwright";
import { join } from "node:path";

async function main() {
  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  console.log(`Launching Chromium (HEADFUL) with profile at: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false, // run headful!
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  // Bypass webdriver detection!
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });

  const page = await context.newPage();
  
  console.log("Navigating to homepage...");
  await page.goto("https://www.douyin.com/");
  await page.waitForTimeout(6000);

  console.log("Locating search input...");
  const searchInput = page.locator('input[placeholder*="搜索"], input[data-e2e="search-input"]').first();
  await searchInput.click();
  await searchInput.fill("IPTV");
  await page.waitForTimeout(1000);

  console.log("Pressing Enter to search...");
  await searchInput.press("Enter");
  
  console.log("Waiting 12 seconds for search results...");
  await page.waitForTimeout(12000);

  const screenshotPath = join(process.cwd(), "scratch", "real_search_screenshot.png");
  console.log(`Taking screenshot to: ${screenshotPath}`);
  await page.screenshot({ path: screenshotPath });

  await context.close();
  console.log("Done!");
}

main().catch(console.error);
