import { chromium } from "playwright";
import { join } from "node:path";

async function main() {
  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  console.log(`Launching Chromium with profile at: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();
  
  console.log("Navigating to main page...");
  await page.goto("https://www.douyin.com/");
  await page.waitForTimeout(5000);

  console.log("Navigating to search page...");
  await page.goto("https://www.douyin.com/search/IPTV?type=general");
  
  console.log("Waiting 10 seconds for hydration and captcha...");
  await page.waitForTimeout(10000);

  const screenshotPath = join(process.cwd(), "scratch", "screenshot.png");
  console.log(`Taking screenshot to: ${screenshotPath}`);
  await page.screenshot({ path: screenshotPath });

  await context.close();
  console.log("Done!");
}

main().catch(console.error);
