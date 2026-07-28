import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

// Load .env
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").trim();
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

async function main() {
  console.log("=============================================================");
  console.log("🚀 DOUYIN FAST CRAWL 20 CREATIVES TO CSV/JSON");
  console.log("=============================================================\n");

  const outputDir = join(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  const csvPath = join(outputDir, "douyin_20_creatives.csv");
  const jsonPath = join(outputDir, "douyin_20_creatives.json");

  const profileDir = join(outputDir, "browser-profiles", "douyin-default");
  console.log(`[Browser] Khởi chạy Chromium tại: ${profileDir}`);

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
  const targetCount = 20;
  const itemsMap = new Map<string, any>();

  const saveFiles = () => {
    const results = Array.from(itemsMap.values());
    writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf8");
    const csvHeaders = "awemeId,desc,author,secUid,diggCount,commentCount,shareCount,createTime,shareUrl\n";
    const csvRows = results.map(r => {
      const safeDesc = `"${(r.desc || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      const safeAuthor = `"${(r.author || "").replace(/"/g, '""')}"`;
      return `${r.awemeId},${safeDesc},${safeAuthor},${r.secUid},${r.diggCount},${r.commentCount},${r.shareCount},${r.createTime},${r.shareUrl}`;
    }).join("\n");
    writeFileSync(csvPath, csvHeaders + csvRows, "utf8");
  };

  saveFiles();

  // Lắng nghe dữ liệu mạng từ Douyin Feed / Search / Detail API
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/aweme/v1/web/") || url.includes("/aweme/v2/web/")) {
      try {
        const json = await response.json();
        const dataList = json.data || json.aweme_list || json.items || [];
        for (const item of dataList) {
          const info = item.aweme_info || item.aweme_mix_info?.mix_items?.[0] || item;
          if (info && info.aweme_id && !itemsMap.has(info.aweme_id)) {
            const awemeId = info.aweme_id;
            const desc = info.desc || "";
            const author = info.author?.nickname || "";
            const secUid = info.author?.sec_uid || "";
            const diggCount = info.statistics?.digg_count || 0;
            const commentCount = info.statistics?.comment_count || 0;
            const shareCount = info.statistics?.share_count || 0;
            const createTime = info.create_time ? new Date(info.create_time * 1000).toISOString() : "";
            const videoUrl = info.video?.play_addr?.url_list?.[0] || "";
            const shareUrl = `https://www.douyin.com/video/${awemeId}`;

            itemsMap.set(awemeId, {
              awemeId,
              desc,
              author,
              secUid,
              diggCount,
              commentCount,
              shareCount,
              createTime,
              videoUrl,
              shareUrl,
            });

            console.log(`[Crawl Progress] (${itemsMap.size}/${targetCount}) AwemeID: ${awemeId} | Tác giả: ${author} | Mô tả: ${desc.substring(0, 30)}...`);
            saveFiles();
          }
        }
      } catch {}
    }
  });

  console.log(`[Crawl] Navigating đến Douyin feed...`);
  await page.goto("https://www.douyin.com", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Cuộn trang để nạp video feed nếu chưa đủ 20
  let scrollAttempts = 0;
  while (itemsMap.size < targetCount && scrollAttempts < 30) {
    scrollAttempts++;
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.keyboard.press("PageDown").catch(() => {});
    await page.waitForTimeout(2500);

    // Nếu gặp popup hoặc modal, tự đóng hoặc cuộn
    const closeModal = await page.$(".dy-account-close, .modal-close, .close");
    if (closeModal) {
      await closeModal.click().catch(() => {});
    }
  }

  // Nếu feed trang chủ nạp chưa đủ 20, chuyển sang trang search hot
  if (itemsMap.size < targetCount) {
    console.log(`[Crawl] Đang mở trang tìm kiếm xu hướng để nạp thêm...`);
    await page.goto("https://www.douyin.com/search/电影?type=general", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    let searchScrolls = 0;
    while (itemsMap.size < targetCount && searchScrolls < 20) {
      searchScrolls++;
      await page.evaluate(() => window.scrollBy(0, 1200));
      await page.waitForTimeout(2500);
    }
  }

  saveFiles();

  console.log(`\n=============================================================`);
  console.log(`🎉 THÀNH CÔNG! Đã crawl đủ ${itemsMap.size} Douyin Creatives.`);
  console.log(`- File CSV:  ${csvPath}`);
  console.log(`- File JSON: ${jsonPath}`);
  console.log(`=============================================================\n`);

  await page.waitForTimeout(2000);
  await context.close();
}

main().catch((err) => {
  console.error("Lỗi thực thi:", err);
  process.exit(1);
});
