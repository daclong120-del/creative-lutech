import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";

async function main() {
  console.log("=======================================================================");
  console.log("🔍 INSPECT DOUYIN SEARCH XHR/FETCH API PAYLOADS");
  console.log("=======================================================================\n");

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu"
    ]
  });

  try {
    const page = await context.newPage();

    page.on("response", async (res) => {
      const type = res.request().resourceType();
      if (type === "xhr" || type === "fetch") {
        const url = res.url();
        if (url.includes("douyin.com")) {
          console.log(`📡 [Network XHR/Fetch]: ${url.substring(0, 100)}`);
          try {
            const json = await res.json();
            if (json) {
              const keys = Object.keys(json);
              console.log(`   -> JSON Status=${res.status()} | Keys=${keys.join(",")}`);
              if (json.data || json.aweme_list || json.items) {
                console.log(`   ✨ [FOUND LIST]: length=${(json.data || json.aweme_list || json.items).length}`);
              }
            }
          } catch {}
        }
      }
    });

    console.log("Điều hướng tới: https://www.douyin.com/search/财经...");
    await page.goto("https://www.douyin.com/search/%E8%B4%A2%E7%BB%8F", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(3000);
    }
  } finally {
    await context.close();
  }
}

main().catch(console.error);
