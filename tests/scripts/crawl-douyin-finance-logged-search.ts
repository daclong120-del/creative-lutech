import { join } from "node:path";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 LOGGED-IN DOUYIN FINANCE SEARCH CRAWLER (20 REAL FINANCE VIDEOS 财经)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-finance-logged");

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_20");
  mkdirSync(outputDir, { recursive: true });

  console.log("[1/3] Khởi chạy Chromium và nạp Authenticated Cookies vào Browser Context...");

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

  // Inject session cookies into Playwright context
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
    console.log(`✅ Đã nạp ${validCookies.length} authenticated cookies vào Playwright Context.`);
  }

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  try {
    const page = await context.newPage();

    // Intercept network responses for search & video APIs
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("/aweme/v1/web/") || url.includes("/search/") || url.includes("/detail/")) {
        try {
          const text = await res.text();
          if (text.includes("play_addr") || text.includes("aweme_id")) {
            const json = JSON.parse(text);
            const list = json?.data || json?.items || json?.aweme_list || json?.cards || [];
            if (Array.isArray(list)) {
              for (const item of list) {
                const aweme = item.aweme_info || item;
                if (!aweme || !aweme.video) continue;
                const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
                const videoUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];

                if (videoUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
                  capturedVideos.push({
                    id: aweme.aweme_id,
                    title: aweme.desc || `Douyin Video Tài Chính ${capturedVideos.length + 1}`,
                    author: aweme.author?.nickname || "Kênh Tài Chính Douyin",
                    mediaUrl: videoUrl,
                    sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
                  });
                  console.log(`   ✨ [Captured Finance Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 40)}`);
                }
              }
            }
          }
        } catch {}
      }
    });

    console.log("[2/3] Điều hướng đến trang tìm kiếm Douyin chủ đề Tài chính (https://www.douyin.com/search/财经)...");
    await page.goto("https://www.douyin.com/search/%E8%B4%A2%E7%BB%8F", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    let scrollAttempts = 0;
    while (capturedVideos.length < 20 && scrollAttempts < 15) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(2500);
      scrollAttempts++;
      console.log(`   [Scroll ${scrollAttempts}/15] Bắt được ${capturedVideos.length}/20 URL video Douyin tài chính...`);
    }

    if (capturedVideos.length < 20) {
      console.log("   -> Tìm kiếm thêm từ khóa Quản lý tài chính (https://www.douyin.com/search/理财)...");
      await page.goto("https://www.douyin.com/search/%E7%90%86%E8%B4%A2", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(5000);

      let scroll2 = 0;
      while (capturedVideos.length < 20 && scroll2 < 10) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(2500);
        scroll2++;
        console.log(`   [Search 2 Scroll ${scroll2}/10] Bắt được ${capturedVideos.length}/20 URL video...`);
      }
    }
  } finally {
    await context.close();
  }

  console.log(`\n✅ Tổng số video Douyin Tài Chính CDN thu thập được: ${capturedVideos.length} items.\n`);

  if (capturedVideos.length === 0) {
    console.error("❌ Chưa thu thập được URL video CDN từ Douyin Search.");
    process.exit(1);
  }

  const targetVideos = capturedVideos.slice(0, 20);

  // Download Real Douyin Finance Videos via DownloaderService
  console.log("-----------------------------------------------------------------------");
  console.log(`📥 Khởi chạy Downloader Service tải ${targetVideos.length} video Douyin Tài Chính vào: ${outputDir}`);
  console.log("-----------------------------------------------------------------------");

  const downloader = new DownloaderService({
    maxConcurrent: 4,
    downloadDir: outputDir,
  });

  const cdnHeaders = {
    "Referer": "https://www.douyin.com/",
    "User-Agent": session.userAgent,
  };

  const tasks = targetVideos.map((v, i) => {
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
  console.log(`- Thành công: ${successCount}/${targetVideos.length} videos`);
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
  console.error("❌ Fatal Error in Logged Douyin Finance Search:", err);
  process.exit(1);
});
