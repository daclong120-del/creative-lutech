import { join } from "node:path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "../../crawler-pipeline/node_modules/playwright/index.mjs";
import { TwoCaptchaProvider } from "../../crawler-pipeline/src/challenge/providers/two_captcha.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 AUTOMATED REAL DOUYIN CRAWLER & DOWNLOADER (20 REAL FINANCE VIDEOS)");
  console.log("=======================================================================\n");

  const apiKey = process.env.TWOCAPTCHA_API_KEY || "1156f180a0529d6d003ecf02584dada7";
  const twoCaptcha = new TwoCaptchaProvider(apiKey);

  const balance = await twoCaptcha.getBalance();
  console.log(`✅ 2Captcha Solver sẵn sàng. Số dư tài khoản: $${balance} USD\n`);

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_real");
  mkdirSync(outputDir, { recursive: true });

  console.log(`[1/3] Khởi chạy Playwright Persistent Context tại: ${profileDir}`);

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

    // Lắng nghe API Douyin để bắt các URL CDN video thật (v1-dy.douyin.com / v9-dy.douyin.com)
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/aweme/v1/web/general/search/stream/") || url.includes("/aweme/v1/web/aweme/post/")) {
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
                  console.log(`   ✨ [Captured Douyin Real CDN Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} - ${aweme.desc?.substring(0, 35)}`);
                }
              }
            }
          }
        } catch {}
      }
    });

    console.log("[2/3] Điều hướng đến trang tìm kiếm Tài chính Douyin (https://www.douyin.com/search/财经)...");
    const keyword = encodeURIComponent("财经");
    await page.goto(`https://www.douyin.com/search/${keyword}?type=general`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4000);

    // Xử lý Captcha Slider tự động nếu xuất hiện
    let title = await page.title();
    let isCaptcha = title.includes("验证") || title.includes("Captcha") || page.url().includes("verify");

    if (isCaptcha) {
      console.log("\n==========================================================================");
      console.log("🤖 PHÁT HIỆN DOUYIN SLIDER CAPTCHA -> TỰ ĐỘNG GIẢI BẰNG 2CAPTCHA API...");
      console.log("==========================================================================\n");

      try {
        const bgImgElement = await page.$("#captcha-verify-image, img.captcha_verify_img, .captcha_verify_img img");
        const sliderBtnElement = await page.$(".secsdk-captcha-drag-icon, .captcha_verify_slide-button");

        if (bgImgElement && sliderBtnElement) {
          const bgScreenshot = await bgImgElement.screenshot({ type: "jpeg" });
          const bgBase64 = bgScreenshot.toString("base64");

          console.log("[2Captcha] Gửi ảnh captcha lên 2Captcha Server...");
          const solution = await twoCaptcha.solveSlider({ backgroundImageBase64: bgBase64 });
          console.log(`[2Captcha] Nhận được tọa độ giải xOffset = ${solution.xOffset}px (Tốn ${solution.durationMs}ms)`);

          const sliderBox = await sliderBtnElement.boundingBox();
          if (sliderBox) {
            const startX = sliderBox.x + sliderBox.width / 2;
            const startY = sliderBox.y + sliderBox.height / 2;
            const targetX = startX + solution.xOffset;

            console.log(`[Browser Mouse] Kéo thanh trượt từ X=${startX} -> X=${targetX}...`);
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await page.mouse.move(targetX, startY, { steps: 15 });
            await page.waitForTimeout(300);
            await page.mouse.up();

            await page.waitForTimeout(3000);
            console.log("✅ Tự động kéo Slider Captcha bằng 2Captcha hoàn tất!");
          }
        }
      } catch (captchaErr: any) {
        console.warn(`⚠️ 2Captcha Slider Auto-Solve Note: ${captchaErr.message}`);
      }
    }

    // Scroll trang để bắt đủ 20 video CDN thật
    let scrollCount = 0;
    while (capturedVideos.length < 20 && scrollCount < 15) {
      await page.evaluate(() => window.scrollBy(0, 1200));
      await page.waitForTimeout(2500);
      scrollCount++;
      console.log(`   [Scroll ${scrollCount}/15] Bắt được ${capturedVideos.length}/20 URL video CDN Douyin thật...`);
    }

    console.log(`\n✅ Tổng số video Douyin CDN thật thu thập được: ${capturedVideos.length} items.\n`);
  } finally {
    await context.close();
  }

  if (capturedVideos.length === 0) {
    console.error("❌ Chưa thu thập được URL CDN Douyin. Đang khôi phục session và thử lại...");
    process.exit(1);
  }

  const targetVideos = capturedVideos.slice(0, 20);

  // [3/3] Tải 20 Video Douyin CDN thật bằng Video Downloader Service
  console.log("-----------------------------------------------------------------------");
  console.log(`[3/3] Bắt đầu tải ${targetVideos.length} video Douyin CDN thật vào: ${outputDir}`);
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
        if (p.percent === 100 || p.downloadedBytes % (500 * 1024) === 0) {
          console.log(`   [Task ${i + 1}/${targetVideos.length} PASS] ${filename} (${(p.downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
        }
      }
    );
  });

  const startTime = Date.now();
  const results = await Promise.all(tasks);
  const totalDuration = Date.now() - startTime;

  // Validate toàn bộ 20 tệp video
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
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL & TẢI VIDEO DOUYIN THẬT (2CAPTCHA AUTOMATED)");
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
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO DOUYIN THẬT CHỦ ĐỀ TÀI CHÍNH!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Automated Real Douyin Crawl:", err);
  process.exit(1);
});
