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

const horrorKeywords = [
  "恐怖电影",
  "鬼片",
  "僵尸片",
  "惊悚电影",
  "悬疑片",
  "林正英",
  "山村老尸",
  "中邪",
  "咒",
  "双瞳",
  "阴阳路",
  "怪谈",
  "恐怖片推荐",
  "林正英僵尸片",
  "香港恐怖片",
  "泰国恐怖片",
  "韩国恐怖片",
  "日本恐怖片",
  "九叔",
  "恐怖电影解说"
];

async function main() {
  console.log("=============================================================");
  console.log("🚀 CRAWL DOUYIN HORROR MOVIES: 20 TỪ KHÓA PHIM MA KHÁC NHAU");
  console.log("=============================================================\n");

  const solver = ChallengeSolverFactory.create();
  if (solver) {
    try {
      const balance = await solver.getBalance();
      console.log(`✅ [2Captcha] Solver sẵn sàng, số dư: $${balance} USD\n`);
    } catch (e: any) {
      console.log(`⚠️ [2Captcha] Số dư: ${e.message}\n`);
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
  const itemsMap = new Map<string, any>();

  const saveFiles = () => {
    const results = Array.from(itemsMap.values());
    writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf8");
    const csvHeaders = "awemeId,keyword,desc,author,secUid,diggCount,commentCount,shareCount,createTime,shareUrl\n";
    const csvRows = results.map(r => {
      const safeDesc = `"${(r.desc || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      const safeAuthor = `"${(r.author || "").replace(/"/g, '""')}"`;
      return `${r.awemeId},"${r.keyword}",${safeDesc},${safeAuthor},${r.secUid},${r.diggCount},${r.commentCount},${r.shareCount},${r.createTime},${r.shareUrl}`;
    }).join("\n");
    writeFileSync(csvPath, csvHeaders + csvRows, "utf8");
  };

  saveFiles();

  let currentKw = "恐怖电影";

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
              keyword: currentKw,
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

            console.log(`[Crawl Item] [Từ khóa: ${currentKw}] (${itemsMap.size}) ${awemeId} | ${author} | ${desc.substring(0, 30)}...`);
            saveFiles();
          }
        }
      } catch {}
    }
  });

  for (let i = 0; i < horrorKeywords.length; i++) {
    currentKw = horrorKeywords[i];
    console.log(`\n=============================================================`);
    console.log(`[Từ khóa ${i + 1}/20] TÌM KIẾM PHIM MA: "${currentKw}" ...`);
    console.log(`=============================================================`);

    const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(currentKw)}?type=general`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3500);

    // Polling Captcha
    let targetFrame = page.mainFrame();
    let clickImgSrc: string | null = null;
    let bgImgSrc: string | null = null;
    let pieceImgSrc: string | null = null;

    for (const frame of page.frames()) {
      try {
        const clickImg = await frame.$eval("#captcha_click_image, .vc-captcha-verify-img-picture, img[src*='3d_']", (el: any) => el.src).catch(() => null);
        if (clickImg) {
          clickImgSrc = clickImg;
          targetFrame = frame;
          break;
        }
        const bg = await frame.$eval("#captcha-verify-image, img.captcha_verify_img_app", (el: any) => el.src).catch(() => null);
        if (bg) {
          bgImgSrc = bg;
          targetFrame = frame;
          pieceImgSrc = await frame.$eval(".captcha_verify_img_slide", (el: any) => el.src).catch(() => null);
          break;
        }
      } catch {}
    }

    if ((clickImgSrc || bgImgSrc) && solver) {
      console.log("⚠️ Douyin bật Captcha! Tiến hành giải tự động qua 2Captcha Solver...");
      try {
        if (clickImgSrc) {
          const clickImgElement = await targetFrame.$("#captcha_click_image, .vc-captcha-verify-img-picture, img[src*='3d_']");
          if (clickImgElement) {
            const buffer = await clickImgElement.screenshot({ type: "jpeg" });
            const imageBase64 = buffer.toString("base64");
            const solution = await (solver as any).solveClick({
              type: "click",
              imageBase64,
              instructions: "点击两个形状相同的物体 (Click two objects with the same shape)",
              pageUrl: page.url(),
            });
            console.log(`[2Captcha] Nhận được tọa độ click:`, JSON.stringify(solution.points));
            if (solution.points && solution.points.length > 0) {
              const box = await clickImgElement.boundingBox();
              if (box) {
                for (const p of solution.points) {
                  await page.mouse.click(box.x + p.x, box.y + p.y);
                  await page.waitForTimeout(1000);
                }
                const confirmBtn = await targetFrame.$(".vc-captcha-verify-confirm-btn, button:has-text('确认'), div:has-text('确认')");
                if (confirmBtn) await confirmBtn.click().catch(() => {});
                await page.waitForTimeout(3000);
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`❌ [2Captcha Error]: ${err.message}`);
      }
    }

    // Scroll down to load search items
    for (let scroll = 0; scroll < 4; scroll++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(2000);
    }
  }

  saveFiles();

  console.log(`\n=============================================================`);
  console.log(`🎉 HOÀN THÀNH CRAWL 20 TỪ KHÓA PHIM MA! Tổng số bài viết thu được: ${itemsMap.size}`);
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
