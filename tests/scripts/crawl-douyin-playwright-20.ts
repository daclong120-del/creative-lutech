import { join } from "node:path";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 REAL DOUYIN HYDRATED CRAWLER & DOWNLOADER (20 FINANCE VIDEOS)");
  console.log("=======================================================================\n");

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance");
  mkdirSync(outputDir, { recursive: true });

  // Read raw cookies
  let rawCookies: any[] = [];
  const rawCookiePath = join(process.cwd(), "scratch", "cookie_doyin.json");
  if (existsSync(rawCookiePath)) {
    try {
      const parsed = JSON.parse(readFileSync(rawCookiePath, "utf8"));
      rawCookies = Array.isArray(parsed) ? parsed : (parsed.cookies || []);
      console.log(`✅ Loaded ${rawCookies.length} raw cookies from: ${rawCookiePath}`);
    } catch (e: any) {
      console.warn(`⚠️ Warning parsing cookies: ${e.message}`);
    }
  }

  console.log(`[1/3] Khởi chạy Playwright Context với Cookie Session thật...`);

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

  if (rawCookies.length > 0) {
    const formattedCookies = rawCookies.map((c: any) => ({
      name: c.name,
      value: c.value,
      domain: c.domain.startsWith(".") ? c.domain : `.${c.domain}`,
      path: c.path || "/",
      secure: c.secure !== false,
      httpOnly: c.httpOnly === true,
      expires: c.expirationDate || c.expires || -1
    }));
    await context.addCookies(formattedCookies);
  }

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  try {
    const page = await context.newPage();

    // Intercept Douyin response JSON API
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/aweme/v1/web/") || url.includes("search/stream") || url.includes("detail")) {
        try {
          const text = await response.text();
          if (text.includes("play_addr") || text.includes("aweme_id")) {
            const json = JSON.parse(text);
            const list = json?.data || json?.items || json?.aweme_list || [];
            if (Array.isArray(list)) {
              for (const item of list) {
                const aweme = item.aweme_info || item;
                const videoUrl = aweme.video?.play_addr?.url_list?.[0] || aweme.video?.play_addr_h264?.url_list?.[0];
                if (videoUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
                  capturedVideos.push({
                    id: aweme.aweme_id || `dy_${Date.now()}_${capturedVideos.length}`,
                    title: aweme.desc || `Douyin Video Tài Chính ${capturedVideos.length + 1}`,
                    author: aweme.author?.nickname || "Douyin Creator",
                    mediaUrl: videoUrl,
                    sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
                  });
                  console.log(`   ✨ [Captured Video CDN ${capturedVideos.length}/20]: ${aweme.aweme_id} - ${aweme.desc?.substring(0, 30)}`);
                }
              }
            }
          }
        } catch {}
      }
    });

    console.log("[2/3] Điều hướng đến trang Douyin...");
    await page.goto("https://www.douyin.com", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    console.log("[2/3] Điều hướng đến từ khóa tìm kiếm Tài chính (财经)...");
    const keyword = encodeURIComponent("财经");
    await page.goto(`https://www.douyin.com/search/${keyword}?type=general`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    // Bắt đầu scroll kéo dữ liệu
    let scrollCount = 0;
    while (capturedVideos.length < 20 && scrollCount < 15) {
      await page.evaluate(() => window.scrollBy(0, 1500));
      await page.waitForTimeout(3000);
      scrollCount++;
      console.log(`   [Scroll ${scrollCount}/15] Bắt được ${capturedVideos.length}/20 URL video CDN Douyin thật...`);
    }

    console.log(`\n✅ Tổng số video Douyin CDN thật thu thập được: ${capturedVideos.length} items.\n`);
  } finally {
    await context.close();
  }

  if (capturedVideos.length === 0) {
    console.error("❌ Thất bại: Chưa thu thập được URL CDN Douyin do bị Douyin chặn verification intermediate page.");
    process.exit(1);
  }

  const targetVideos = capturedVideos.slice(0, 20);

  // Download 20 Real Videos via DownloaderService
  console.log("-----------------------------------------------------------------------");
  console.log(`[3/3] Tải ${targetVideos.length} video Douyin CDN thật vào: ${outputDir}`);
  console.log("-----------------------------------------------------------------------");

  const downloader = new DownloaderService({
    maxConcurrent: 3,
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
  console.log("📊 BÁO CÁO TỰ ĐỘNG CRAWL & TẢI VIDEO DOUYIN CDN THẬT");
  console.log("=======================================================================");
  console.log(`- Thành công: ${successCount}/${targetVideos.length} videos`);
  console.log(`- Dung lượng: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Thời gian tải pool: ${totalDuration}ms\n`);

  console.table(report.map(r => ({
    "STT": r.index,
    "Tên File": r.filename,
    "Tiêu Đề": r.title.substring(0, 32),
    "Size (MB)": r.sizeMb,
    "MD5 Checksum": r.checksum,
    "Trạng Thái": r.status,
  })));

  if (successCount > 0) {
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO DOUYIN THẬT CHỦ ĐỀ TÀI CHÍNH!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Real Douyin Crawl:", err);
  process.exit(1);
});
