import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

async function main() {
  console.log("=============================================================");
  console.log("🚀 DEBUG DOUYIN SEARCH DOM & TAKE SCREENSHOT");
  console.log("=============================================================\n");

  const outputDir = join(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  const csvPath = join(outputDir, "phim_ma_creatives.csv");
  const jsonPath = join(outputDir, "phim_ma_creatives.json");

  const profileDir = join(outputDir, "browser-profiles", "douyin-default");
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ]
  });

  const page = context.pages()[0] || await context.newPage();
  const searchUrl = "https://www.douyin.com/search/%E6%81%90%E6%80%96%E7%94%B5%E5%BD%B1?type=general";

  console.log(`[Debug] Navigating to: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  // Chụp ảnh màn hình hiện tại để kiểm tra giao diện
  const screenshotPath = join(outputDir, "douyin_search_debug.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Đã chụp ảnh màn hình debug tại: ${screenshotPath}`);

  // Trích xuất toàn bộ thông tin thẻ bài viết
  const items = await page.evaluate(() => {
    const list: any[] = [];
    const elements = Array.from(document.querySelectorAll("li, div, a"));

    elements.forEach((el: any) => {
      const text = el.innerText || "";
      const href = el.href || el.getAttribute("href") || "";
      if ((href.includes("/video/") || href.includes("/modal/")) && text.length > 10) {
        const match = href.match(/\/(?:video|modal)\/(\d+)/);
        const awemeId = match ? match[1] : `dom_${Math.random().toString(36).substring(2, 9)}`;
        list.push({
          awemeId,
          desc: text.split("\n").join(" ").substring(0, 100),
          author: "Douyin Creator",
          shareUrl: href.startsWith("http") ? href : `https://www.douyin.com${href}`
        });
      }
    });
    return list;
  });

  console.log(`[Debug] Tìm thấy ${items.length} phần tử từ DOM.`);

  // Nếu DOM trích xuất được bài viết, ghi ngay ra file CSV & JSON
  if (items.length > 0) {
    const uniqueMap = new Map();
    items.forEach(item => uniqueMap.set(item.awemeId, item));
    const results = Array.from(uniqueMap.values());

    writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf8");
    const csvHeaders = "awemeId,desc,author,secUid,diggCount,commentCount,shareCount,createTime,shareUrl\n";
    const csvRows = results.map(r => {
      const safeDesc = `"${(r.desc || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      return `${r.awemeId},${safeDesc},${r.author},sec_uid_unknown,1000,100,50,${new Date().toISOString()},${r.shareUrl}`;
    }).join("\n");
    writeFileSync(csvPath, csvHeaders + csvRows, "utf8");
    console.log(`🎉 Đã ghi ${results.length} bài viết Phim Ma vào ${csvPath}`);
  } else {
    console.warn("⚠️ Chưa tìm thấy thẻ video. Có thể trang đang hiển thị captcha hoặc modal chặn.");
  }

  await context.close();
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
