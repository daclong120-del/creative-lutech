import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { chromium } from "playwright";
import { ChallengeSolverFactory } from "../../crawler-pipeline/src/challenge/solver.js";

// Load .env manually if process.env values are missing
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
  console.log("🚀 CHROMIUM DOUYIN CAPTCHA TRIGGER & SOLVER TEST");
  console.log("=============================================================\n");

  console.log(`- CAPTCHA_ENABLED:         ${process.env.CAPTCHA_ENABLED}`);
  console.log(`- CAPTCHA_PROVIDER:        ${process.env.CAPTCHA_PROVIDER}`);
  console.log(`- TWOCAPTCHA_API_KEY:      ${process.env.TWOCAPTCHA_API_KEY ? process.env.TWOCAPTCHA_API_KEY.substring(0, 8) + "..." : "(missing)"}\n`);

  const solver = ChallengeSolverFactory.create();
  if (solver) {
    try {
      const balance = await solver.getBalance();
      console.log(`✅ [2Captcha] Key hợp lệ, số dư khả dụng: $${balance} USD\n`);
    } catch (e: any) {
      console.error(`❌ [2Captcha] Lỗi kiểm tra số dư: ${e.message}`);
    }
  } else {
    console.warn("⚠️ CAPTCHA_ENABLED hoặc TWOCAPTCHA_API_KEY chưa sẵn sàng trong .env!");
  }

  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-trigger-test");
  console.log(`[Browser] Khởi chạy Chromium Non-Headless tại profile: ${profileDir}`);

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

  const keywords = ["美女", "funny", "news", "game", "dance", "food", "tech", "auto", "sports", "travel"];

  let captchaDetected = false;

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/aweme/v1/web/general/search/stream/")) {
      try {
        const text = await response.text();
        if (text.includes("verify_check") || text.includes('"result_status":5')) {
          console.log("\n🚨 NETWORK STREAM DETECTED `verify_check` / anti-bot block!");
        }
      } catch {}
    }
  });

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    console.log(`\n[Loop ${i + 1}/${keywords.length}] Tìm kiếm từ khóa: "${kw}" ...`);
    await page.goto(`https://www.douyin.com/search/${encodeURIComponent(kw)}?type=general`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    }).catch(() => {});

    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log(`- Page title: "${title}"`);

    // Check DOM for Captcha elements
    const captchaSelector = ".captcha_verify_container, #captcha-verify-image, .secsdk-captcha-drag-icon, .captcha_verify_img_slide";
    const hasCaptchaElement = await page.$(captchaSelector).then(el => !!el).catch(() => false);
    const isCaptchaPage = title.includes("验证") || title.includes("Captcha");

    if (isCaptchaPage || hasCaptchaElement) {
      captchaDetected = true;
      console.log("\n=============================================================");
      console.log("⚠️ ĐÃ PHÁT HIỆN CAPTCHA UI TRÊN MÀN HÌNH / PAGE TITLE!");
      console.log("=============================================================\n");

      if (solver) {
        console.log("[Solver] Khởi chạy 2Captcha Solver tự động...");
        const bgImg = await page.$eval("#captcha-verify-image", (el: any) => el.src).catch(() => null);
        const pieceImg = await page.$eval(".captcha_verify_img_slide", (el: any) => el.src).catch(() => null);

        console.log(`- Background image found: ${!!bgImg}`);
        console.log(`- Piece image found: ${!!pieceImg}`);

        if (bgImg && bgImg.startsWith("data:image")) {
          const bgBase64 = bgImg.split(",")[1];
          const pieceBase64 = pieceImg && pieceImg.startsWith("data:image") ? pieceImg.split(",")[1] : undefined;

          console.log("[2Captcha] Đang gửi ảnh slider lên 2Captcha server...");
          try {
            const solution = await solver.solveSlider({
              type: "slider",
              backgroundImageBase64: bgBase64,
              pieceImageBase64: pieceBase64,
              pageUrl: page.url(),
            });
            console.log(`[2Captcha] Kết quả nhận được xOffset: ${solution.xOffset}`);
          } catch (err: any) {
            console.error(`[2Captcha] Lỗi giải captcha: ${err.message}`);
          }
        } else {
          console.warn("[2Captcha] Không trích xuất được base64 image của Captcha slider.");
        }
      }
      break;
    }

    // Scroll down to generate search requests
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2000);
  }

  if (!captchaDetected) {
    console.log("\nChưa gặp Captcha UI trực tiếp trong danh sách từ khóa thử nghiệm.");
    console.log("Trình duyệt vẫn sẽ mở trong 20 giây để quan sát...");
    await page.waitForTimeout(20000);
  }

  await context.close();
}

main().catch((err) => {
  console.error("Lỗi thực thi:", err);
  process.exit(1);
});
