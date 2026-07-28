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
  console.log("🚀 CRAWL DOUYIN SEARCH: 恐怖电影 (PHIM MA)");
  console.log("=============================================================\n");

  const outputDir = join(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  const csvPath = join(outputDir, "phim_ma_creatives.csv");
  const jsonPath = join(outputDir, "phim_ma_creatives.json");

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
  const keyword = "恐怖电影";
  const targetCount = 50;
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

  // Lắng nghe dữ liệu mạng từ Douyin Search API
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/aweme/v1/web/general/search/stream/") || url.includes("/aweme/v1/web/search/item/")) {
      try {
        const json = await response.json();
        const dataList = json.data || json.aweme_list || [];
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

            console.log(`[Crawl Progress] (${itemsMap.size}/${targetCount}) AwemeID: ${awemeId} | Tác giả: ${author} | Mô tả: ${desc.substring(0, 35)}...`);
            saveFiles();
          }
        }
      } catch {}
    }
  });

  const targetUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}?type=general`;
  console.log(`[Crawl] Mở trang tìm kiếm từ khóa "${keyword}": ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Cuộn trang để nạp thêm các bài viết về phim ma
  let scrollAttempts = 0;
  while (itemsMap.size < targetCount && scrollAttempts < 35) {
    scrollAttempts++;
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.keyboard.press("PageDown").catch(() => {});
    await page.waitForTimeout(2000);

    const loadMoreBtn = await page.$("text=点击加载更多, text=加载更多");
    if (loadMoreBtn) {
      await loadMoreBtn.click().catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  saveFiles();

  console.log(`\n=============================================================`);
  console.log(`🎉 THÀNH CÔNG! Đã crawl đúng ${itemsMap.size} Douyin Creatives chủ đề PHIM MA (恐怖电影).`);
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
