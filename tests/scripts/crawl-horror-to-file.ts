import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { ChallengeSolverFactory } from "../../crawler-pipeline/src/challenge/solver.js";

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
  console.log("🚀 DOUYIN CRAWL HORROR MOVIES (恐怖电影) WITH 2CAPTCHA 3D & SLIDER");
  console.log("=============================================================\n");

  const solver = ChallengeSolverFactory.create();
  if (solver) {
    try {
      const balance = await solver.getBalance();
      console.log(`✅ [2Captcha] Solver sẵn sàng, số dư: $${balance} USD\n`);
    } catch (e: any) {
      console.log(`⚠️ [2Captcha] Kiểm tra số dư: ${e.message}\n`);
    }
  }

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

            console.log(`[Crawl Progress] (${itemsMap.size}/${targetCount}) AwemeID: ${awemeId} | Tác giả: ${author} | Mô tả: ${desc.substring(0, 30)}...`);
            saveFiles();
          }
        }
      } catch {}
    }
  });

  // Navigating to search page
  await page.goto(`https://www.douyin.com/search/${encodeURIComponent(keyword)}?type=general`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  }).catch(() => {});

  await page.waitForTimeout(4000);

  // Polling chờ Captcha iframe nạp đầy đủ trong 15s nếu có
  let targetFrame = page.mainFrame();
  let clickImgSrc: string | null = null;
  let bgImgSrc: string | null = null;
  let pieceImgSrc: string | null = null;

  console.log("[Captcha] Đang chờ và lắng nghe Captcha iframe nạp...");
  for (let poll = 0; poll < 12; poll++) {
    for (const frame of page.frames()) {
      try {
        const clickImg = await frame.$eval("#captcha_click_image, .vc-captcha-verify-img-picture, img[src*='3d_']", (el: any) => el.src).catch(() => null);
        if (clickImg) {
          clickImgSrc = clickImg;
          targetFrame = frame;
          console.log(`[Captcha Detector] Phát hiện 3D Click Captcha trong frame: ${frame.url() || "subframe"}`);
          break;
        }

        const bg = await frame.$eval("#captcha-verify-image, img.captcha_verify_img_app", (el: any) => el.src).catch(() => null);
        if (bg) {
          bgImgSrc = bg;
          targetFrame = frame;
          pieceImgSrc = await frame.$eval(".captcha_verify_img_slide", (el: any) => el.src).catch(() => null);
          console.log(`[Captcha Detector] Phát hiện Slider Captcha trong frame: ${frame.url() || "subframe"}`);
          break;
        }
      } catch {}
    }
    if (clickImgSrc || bgImgSrc) break;
    await page.waitForTimeout(1500);
  }

  const title = await page.title();
  let isCaptchaPage = title.includes("验证") || title.includes("Captcha");


  if (isCaptchaPage || clickImgSrc || bgImgSrc) {
    console.log("⚠️ Douyin hiển thị Captcha UI! Tiến hành tự động gửi 2Captcha Solver...");

    if (solver) {
      try {
        // CASE 1: 3D Click Captcha
        if (clickImgSrc) {
          console.log("[2Captcha] Trích xuất base64 từ 3D Click Captcha Image...");
          const clickImgElement = await targetFrame.$("#captcha_click_image, .vc-captcha-verify-img-picture, img[src*='3d_']");

          let imageBase64 = "";
          if (clickImgSrc.startsWith("data:image")) {
            imageBase64 = clickImgSrc.split(",")[1];
          } else if (clickImgElement) {
            // Take screenshot of the click captcha image element directly
            const buffer = await clickImgElement.screenshot({ type: "jpeg" });
            imageBase64 = buffer.toString("base64");
          }

          if (imageBase64) {
            console.log("[2Captcha] Đang gửi 3D Click image base64 lên 2Captcha Server...");
            const clickSolution = await (solver as any).solveClick({
              type: "click",
              imageBase64,
              instructions: "点击两个形状相同的物体 (Click two objects with the same shape)",
              pageUrl: page.url(),
            });

            console.log(`✅ [2Captcha] Nhận được tọa độ click từ 2Captcha:`, JSON.stringify(clickSolution.points));

            if (clickSolution.points && clickSolution.points.length > 0 && clickImgElement) {
              const box = await clickImgElement.boundingBox();
              if (box) {
                for (const point of clickSolution.points) {
                  const clickX = box.x + point.x;
                  const clickY = box.y + point.y;
                  console.log(`[2Captcha Mouse Click] Nhấp vào tọa độ: x=${clickX}, y=${clickY}`);
                  await page.mouse.click(clickX, clickY);
                  await page.waitForTimeout(1000);
                }

                // Click confirm button
                const confirmBtn = await targetFrame.$(".vc-captcha-verify-confirm-btn, button:has-text('确认'), div:has-text('确认')");
                if (confirmBtn) {
                  await confirmBtn.click().catch(() => {});
                  console.log("[2Captcha] Đã nhấp nút Xác nhận 确认!");
                  await page.waitForTimeout(4000);
                }
              }
            }
          }
        }
        // CASE 2: Slider Captcha
        else if (bgImgSrc) {
          let bgBase64 = "";
          let pieceBase64 = undefined;

          if (bgImgSrc.startsWith("data:image")) {
            bgBase64 = bgImgSrc.split(",")[1];
            pieceBase64 = pieceImgSrc && pieceImgSrc.startsWith("data:image") ? pieceImgSrc.split(",")[1] : undefined;
          }

          if (bgBase64) {
            console.log("[2Captcha] Đang gửi Slider Captcha base64 lên 2Captcha Server...");
            const solution = await solver.solveSlider({
              type: "slider",
              backgroundImageBase64: bgBase64,
              pieceImageBase64: pieceBase64,
              pageUrl: page.url(),
            });

            console.log(`✅ [2Captcha] Nhận được xOffset slider từ 2Captcha: ${solution.xOffset}px`);

            if (solution.xOffset && solution.xOffset > 0) {
              const sliderHandle = await targetFrame.$(".secsdk-captcha-drag-icon, .captcha_verify_slide_button, .secsdk_captcha_in_slider");
              if (sliderHandle) {
                const box = await sliderHandle.boundingBox();
                if (box) {
                  const startX = box.x + box.width / 2;
                  const startY = box.y + box.height / 2;
                  await page.mouse.move(startX, startY);
                  await page.mouse.down();
                  await page.mouse.move(startX + solution.xOffset, startY, { steps: 20 });
                  await page.mouse.up();
                  console.log("✅ Đã kéo slider xong! Chờ Douyin xác nhận...");
                  await page.waitForTimeout(4000);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`❌ [2Captcha Error]: ${err.message}`);
      }
    }
  }

  // Cuộn trang liên tục để nạp đủ 50 kết quả phim ma
  let scrollAttempts = 0;
  while (itemsMap.size < targetCount && scrollAttempts < 35) {
    scrollAttempts++;
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(2000);

    saveFiles();

    const loadMoreBtn = await page.$("text=点击加载更多, text=加载更多");
    if (loadMoreBtn) {
      await loadMoreBtn.click().catch(() => {});
      await page.waitForTimeout(2000);
      saveFiles();
    }
  }

  saveFiles();

  console.log(`\n=============================================================`);
  console.log(`🎉 THÀNH CÔNG! Đã crawl đủ ${itemsMap.size} Douyin Creatives Phim Ma.`);
  console.log(`- File CSV:  ${csvPath}`);
  console.log(`- File JSON: ${jsonPath}`);
  console.log(`=============================================================\n`);

  await page.waitForTimeout(3000);
  await context.close();
}

main().catch((err) => {
  console.error("Lỗi thực thi:", err);
  process.exit(1);
});
