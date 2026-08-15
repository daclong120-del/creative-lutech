import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { getAwemeDetail } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🎯 HYBRID PLAYWRIGHT + SIGNED API DOUYIN FINANCE CRAWLER (20 REAL VIDEOS)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-finance-hybrid");

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_20");
  mkdirSync(outputDir, { recursive: true });

  console.log("[1/3] Khởi chạy Playwright Chromium truy cập Douyin Search (财经)...");

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: { width: 1920, height: 1080 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu"
    ]
  });

  const awemeIds = new Set<string>();

  try {
    const page = await context.newPage();

    // Listen to network & DOM for video IDs
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("/video/") || url.includes("aweme_id")) {
        const matches = url.match(/\/video\/(\d+)/) || url.match(/aweme_id=(\d+)/);
        if (matches && matches[1]) {
          awemeIds.add(matches[1]);
        }
      }
    });

    console.log("   -> Điều hướng tới https://www.douyin.com/search/财经...");
    await page.goto("https://www.douyin.com/search/%E8%B4%A2%E7%BB%8F?type=general", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(2000);

      // Extract hrefs from DOM
      const domIds: string[] = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/video/"]'));
        return links
          .map(a => (a as HTMLAnchorElement).href)
          .map(href => {
            const m = href.match(/\/video\/(\d+)/);
            return m ? m[1] : "";
          })
          .filter(id => id.length > 5);
      });

      for (const id of domIds) {
        awemeIds.add(id);
      }
      console.log(`   [Scroll ${i + 1}/10] Đã thu thập được ${awemeIds.size} aweme_id Douyin tài chính thực tế...`);
      if (awemeIds.size >= 25) break;
    }
  } finally {
    await context.close();
  }

  console.log(`\n✅ Tổng số aweme_id Douyin tài chính thu thập được từ DOM: ${awemeIds.size} IDs.`);

  if (awemeIds.size === 0) {
    console.error("❌ Chưa thu thập được aweme_id từ trang Douyin Search.");
    process.exit(1);
  }

  const idList = Array.from(awemeIds).slice(0, 20);
  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  console.log(`\n[2/3] Gọi Signed API (getAwemeDetail) bóc tách URL CDN stream cho 20 video...`);

  for (const awemeId of idList) {
    try {
      const detailRes = await getAwemeDetail(session, awemeId);
      const aweme = detailRes?.aweme_detail || detailRes?.aweme_info;
      if (aweme && aweme.video) {
        const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
        const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];
        if (playUrl) {
          capturedVideos.push({
            id: awemeId,
            title: aweme.desc || `Douyin Finance Video ${capturedVideos.length + 1}`,
            author: aweme.author?.nickname || "Kênh Tài Chính Douyin",
            mediaUrl: playUrl,
            sourceUrl: `https://www.douyin.com/video/${awemeId}`,
          });
          console.log(`   ✨ [Fetched Video ${capturedVideos.length}/20]: ID=${awemeId} | ${aweme.desc?.substring(0, 40)}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Detail API error for aweme_id ${awemeId}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n[3/3] Tải ${capturedVideos.length} video Douyin Tài Chính vào: ${outputDir}`);

  const downloader = new DownloaderService({
    maxConcurrent: 4,
    downloadDir: outputDir,
  });

  const cdnHeaders = {
    "Referer": "https://www.douyin.com/",
    "User-Agent": session.userAgent,
  };

  const tasks = capturedVideos.map((v, i) => {
    const filename = `douyin_finance_${String(i + 1).padStart(2, "0")}.mp4`;
    return downloader.download(
      {
        id: v.id,
        url: v.mediaUrl,
        platform: "douyin",
        destination: "local",
        outputPath: filename,
        headers: cdnHeaders,
        metadata: { title: v.title, author: v.author, sourceUrl: v.sourceUrl },
      },
      (p) => {
        if (p.percent === 100) {
          console.log(`   [Task ${i + 1}/${capturedVideos.length} PASS] ${filename} (${(p.downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
        }
      }
    );
  });

  const startTime = Date.now();
  const results = await Promise.all(tasks);
  const totalDuration = Date.now() - startTime;

  const report: any[] = [];
  let totalBytes = 0;
  let successCount = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const v = capturedVideos[i];
    if (r.success && r.filePath) {
      const val = await MediaValidator.validateFile(r.filePath);
      if (val.valid) {
        successCount++;
        totalBytes += r.fileSize;
        report.push({
          index: i + 1,
          filename: `douyin_finance_${String(i + 1).padStart(2, "0")}.mp4`,
          title: v.title,
          author: v.author,
          sizeMb: (r.fileSize / 1024 / 1024).toFixed(2),
          checksum: val.checksum,
          filePath: r.filePath,
          status: "PASS",
        });
      }
    }
  }

  console.log("\n=======================================================================");
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL & TẢI 20 VIDEO DOUYIN TÀI CHÍNH THẬT");
  console.log("=======================================================================");
  console.log(`- Thành công: ${successCount}/${capturedVideos.length} videos`);
  console.log(`- Dung lượng: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Thời gian thực thi pool: ${totalDuration}ms\n`);

  console.table(report.map(r => ({
    "STT": r.index,
    "Tên File": r.filename,
    "Kênh Creator": r.author,
    "Tiêu Đề Bài Đăng": r.title.substring(0, 35),
    "Size (MB)": r.sizeMb,
    "MD5 Checksum": r.checksum,
    "Trạng Thái": r.status,
  })));

  if (successCount > 0) {
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO DOUYIN TÀI CHÍNH THẬT!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Douyin Finance Hybrid Crawl:", err);
  process.exit(1);
});
