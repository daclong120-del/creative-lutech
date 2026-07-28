import { chromium } from "playwright";
import { existsSync } from "node:fs";

(async () => {
  const supermiumPath = process.env.SUPERMIUM_PATH || "C:\\Program Files\\Supermium\\chrome.exe";
  console.log(`[Test Supermium] Checking path: ${supermiumPath}`);

  if (!existsSync(supermiumPath)) {
    console.error(`❌ File thực thi Supermium không tồn tại tại: ${supermiumPath}`);
    process.exit(1);
  }

  console.log(`✅ Đã tìm thấy Supermium binary tại: ${supermiumPath}`);
  console.log(`🚀 Khởi chạy Supermium trình duyệt qua Playwright...`);

  try {
    const browser = await chromium.launch({
      executablePath: supermiumPath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage"
      ]
    });

    console.log(`✅ Supermium launch thành công!`);
    const page = await browser.newPage();
    console.log(`🌐 Đang điều hướng đến https://example.com ...`);
    await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 15000 });
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    await browser.close();
    console.log(`🎉 Test Supermium launch hoàn tất thành công!`);
  } catch (err: any) {
    console.error(`❌ Lỗi khi khởi chạy Supermium:`, err.message || err);
    process.exit(1);
  }
})();
