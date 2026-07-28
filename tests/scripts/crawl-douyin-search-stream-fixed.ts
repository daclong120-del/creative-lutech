import { join } from "node:path";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { getAwemeDetail } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 DOM & API HYBRID DOUYIN FINANCE CRAWLER (20 REAL FINANCE VIDEOS)");
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

  console.log("[1/3] Khởi chạy Playwright Chromium nạp Session Cookie & Truy cập Douyin Search...");

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

  if (session.cookies && session.cookies.length > 0) {
    const validCookies = session.cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain || ".douyin.com",
      path: c.path || "/",
      expires: c.expires || Date.now() / 1000 + 86400 * 30,
      httpOnly: c.httpOnly ?? false,
      secure: c.secure ?? false,
      sameSite: (c.sameSite === "None" || c.sameSite === "Lax" || c.sameSite === "Strict" ? c.sameSite : "Lax") as any,
    }));
    await context.addCookies(validCookies);
    console.log(`✅ Đã nạp ${validCookies.length} cookies vào Chromium.`);
  }

  const awemeIds = new Set<string>();

  try {
    const page = await context.newPage();

    // 1. Intercept search stream API
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("/general/search/stream/") || url.includes("/search/item/") || url.includes("/tab/feed/")) {
        try {
          const json = await res.json();
          const list = json?.data || json?.aweme_list || json?.items || [];
          for (const item of list) {
            const aweme = item.aweme_info || item;
            if (aweme && aweme.aweme_id) {
              awemeIds.add(String(aweme.aweme_id));
            }
          }
        } catch {}
      }
    });

    console.log("   -> Mở trang https://www.douyin.com/search/财经...");
    await page.goto("https://www.douyin.com/search/%E8%B4%A2%E7%BB%8F", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    // 2. Extract DOM links
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(2000);

      // Extract video hrefs from DOM
      const domHrefs = await page.$$eval('a[href*="video"]', els => els.map(e => (e as HTMLAnchorElement).href));
      for (const href of domHrefs) {
        const match = href.match(/video\/(\d{18,20})/);
        if (match && match[1]) {
          awemeIds.add(match[1]);
        }
      }

      console.log(`   [Scroll ${i + 1}/10] Đã thu thập được ${awemeIds.size}/20 aweme_id Douyin tài chính thực tế...`);
      if (awemeIds.size >= 25) break;
    }

    if (awemeIds.size < 20) {
      console.log("   -> Mở trang https://www.douyin.com/search/理财...");
      await page.goto("https://www.douyin.com/search/%E7%90%86%E8%B4%A2", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(5000);

      for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(2000);

        const domHrefs = await page.$$eval('a[href*="video"]', els => els.map(e => (e as HTMLAnchorElement).href));
        for (const href of domHrefs) {
          const match = href.match(/video\/(\d{18,20})/);
          if (match && match[1]) {
            awemeIds.add(match[1]);
          }
        }

        console.log(`   [Search 2 Scroll ${i + 1}/8] Đã thu thập được ${awemeIds.size}/20 aweme_id...`);
        if (awemeIds.size >= 25) break;
      }
    }
  } finally {
    await context.close();
  }

  console.log(`\n✅ Tổng số aweme_id Douyin tài chính thu thập được từ DOM & API: ${awemeIds.size} IDs.`);

  if (awemeIds.size === 0) {
    console.error("❌ Chưa thu thập được aweme_id từ trang Douyin Search.");
    process.exit(1);
  }

  const idList = Array.from(awemeIds).slice(0, 25);
  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  console.log(`\n[2/3] Gọi Signed API (getAwemeDetail) bóc tách chi tiết & URL stream cho 20 video...`);

  for (const awemeId of idList) {
    if (capturedVideos.length >= 20) break;
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
          console.log(`   ✨ [Fetched Finance Video ${capturedVideos.length}/20]: ID=${awemeId} | ${aweme.desc?.substring(0, 40)}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Detail API error for aweme_id ${awemeId}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n[3/3] Bắt đầu tải ${capturedVideos.length} video Douyin TÀI CHÍNH vào: ${outputDir}`);

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
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL & TẢI 20 VIDEO DOUYIN CHỦ ĐỀ TÀI CHÍNH THẬT");
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
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO DOUYIN CHỦ ĐỀ TÀI CHÍNH THẬT!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Hybrid Douyin Finance Crawl:", err);
  process.exit(1);
});
