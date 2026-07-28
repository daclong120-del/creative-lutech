import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 REAL DOUYIN HOMEPAGE & SEARCH FEED CRAWLER (20 REAL VIDEOS)");
  console.log("=======================================================================\n");

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const outputDir = join(process.cwd(), "output", "downloads", "douyin_real_20");
  mkdirSync(outputDir, { recursive: true });

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

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  try {
    const page = await context.newPage();

    // Intercept Douyin feed & search API responses
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("/aweme/v1/web/") || url.includes("/feed/") || url.includes("/search/")) {
        try {
          const text = await res.text();
          if (text.includes("play_addr") || text.includes("aweme_id")) {
            const json = JSON.parse(text);
            const list = json?.data || json?.items || json?.aweme_list || json?.cards || [];
            if (Array.isArray(list)) {
              for (const item of list) {
                const aweme = item.aweme_info || item;
                const videoUrl = aweme.video?.play_addr?.url_list?.[0] || aweme.video?.play_addr_h264?.url_list?.[0];
                if (videoUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
                  capturedVideos.push({
                    id: aweme.aweme_id || `dy_${Date.now()}_${capturedVideos.length}`,
                    title: aweme.desc || `Douyin Video Thực Tế ${capturedVideos.length + 1}`,
                    author: aweme.author?.nickname || "Douyin Creator",
                    mediaUrl: videoUrl,
                    sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
                  });
                  console.log(`   ✨ [CAPTURED REAL DOUYIN CDN VIDEO ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 35)}`);
                }
              }
            }
          }
        } catch {}
      }
    });

    console.log("[1/3] Mở trang chủ Douyin (https://www.douyin.com)...");
    await page.goto("https://www.douyin.com", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    // Kéo feed trang chủ
    let scrollCount = 0;
    while (capturedVideos.length < 20 && scrollCount < 10) {
      await page.keyboard.press("PageDown");
      await page.waitForTimeout(2500);
      scrollCount++;
      console.log(`   [Scroll Feed ${scrollCount}/10] Đã bắt được ${capturedVideos.length}/20 URL video CDN Douyin thật...`);
    }

    if (capturedVideos.length < 20) {
      console.log("[2/3] Chuyển sang trang Tìm Kiếm Douyin (https://www.douyin.com/search/财经)...");
      await page.goto("https://www.douyin.com/search/%E8%B4%A2%E7%BB%8F?type=general", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(4000);

      let searchScroll = 0;
      while (capturedVideos.length < 20 && searchScroll < 10) {
        await page.evaluate(() => window.scrollBy(0, 1200));
        await page.waitForTimeout(2500);
        searchScroll++;
        console.log(`   [Search Scroll ${searchScroll}/10] Đã bắt được ${capturedVideos.length}/20 URL video CDN...`);
      }
    }

    console.log(`\n✅ Tổng số video Douyin CDN thật thu thập được: ${capturedVideos.length} items.\n`);
  } finally {
    await context.close();
  }

  if (capturedVideos.length === 0) {
    console.error("❌ Thất bại: Chưa thu thập được URL CDN Douyin thực tế.");
    process.exit(1);
  }

  const targetVideos = capturedVideos.slice(0, 20);

  // Download Real Douyin Videos via DownloaderService
  console.log("-----------------------------------------------------------------------");
  console.log(`📥 Khởi chạy Downloader Service tải ${targetVideos.length} video Douyin CDN thật vào: ${outputDir}`);
  console.log("-----------------------------------------------------------------------");

  const downloader = new DownloaderService({
    maxConcurrent: 4,
    downloadDir: outputDir,
  });

  const tasks = targetVideos.map((v, i) => {
    const filename = `douyin_real_${String(i + 1).padStart(2, "0")}.mp4`;
    return downloader.download(
      {
        id: v.id,
        url: v.mediaUrl,
        platform: "douyin",
        destination: "local",
        outputPath: filename,
        headers: {
          "Referer": "https://www.douyin.com/",
        },
        metadata: { title: v.title, author: v.author, sourceUrl: v.sourceUrl },
      },
      (p) => {
        if (p.percent === 100) {
          console.log(`   [Task ${i + 1}/${targetVideos.length} PASS] ${filename} (${(p.downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
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
    const v = targetVideos[i];
    if (r.success && r.filePath) {
      const val = await MediaValidator.validateFile(r.filePath);
      if (val.valid) {
        successCount++;
        totalBytes += r.fileSize;
        report.push({
          index: i + 1,
          filename: `douyin_real_${String(i + 1).padStart(2, "0")}.mp4`,
          title: v.title,
          sizeMb: (r.fileSize / 1024 / 1024).toFixed(2),
          checksum: val.checksum,
          filePath: r.filePath,
          status: "PASS",
        });
      }
    }
  }

  console.log("\n=======================================================================");
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL & TẢI VIDEO DOUYIN THẬT");
  console.log("=======================================================================");
  console.log(`- Thành công: ${successCount}/${targetVideos.length} videos`);
  console.log(`- Dung lượng: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Thời gian thực thi pool: ${totalDuration}ms\n`);

  console.table(report.map(r => ({
    "STT": r.index,
    "Tên File": r.filename,
    "Tiêu Đề Bài Đăng": r.title.substring(0, 35),
    "Size (MB)": r.sizeMb,
    "MD5 Checksum": r.checksum,
    "Trạng Thái": r.status,
  })));

  if (successCount > 0) {
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO DOUYIN THẬT!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Douyin Feed Crawl:", err);
  process.exit(1);
});
