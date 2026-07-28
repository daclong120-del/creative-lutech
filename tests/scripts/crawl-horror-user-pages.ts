import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

async function main() {
  console.log("=============================================================");
  console.log("🚀 CRAWL DOUYIN CREATIVES PHIM MA TỪ CÁC KÊNH PHIM DÀNH CHO BROWSER");
  console.log("=============================================================\n");

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
    const csvHeaders = "awemeId,desc,author,secUid,diggCount,commentCount,shareCount,createTime,shareUrl\n";
    const csvRows = results.map(r => {
      const safeDesc = `"${(r.desc || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      const safeAuthor = `"${(r.author || "").replace(/"/g, '""')}"`;
      return `${r.awemeId},${safeDesc},${safeAuthor},${r.secUid},${r.diggCount},${r.commentCount},${r.shareCount},${r.createTime},${r.shareUrl}`;
    }).join("\n");
    writeFileSync(csvPath, csvHeaders + csvRows, "utf8");
  };

  saveFiles();

  // Network listener
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/aweme/v1/web/aweme/post/") || url.includes("/aweme/v1/web/general/search/stream/")) {
      try {
        const json = await response.json();
        const dataList = json.aweme_list || json.data || [];
        for (const info of dataList) {
          const item = info.aweme_info || info;
          if (item && item.aweme_id && !itemsMap.has(item.aweme_id)) {
            const awemeId = item.aweme_id;
            const desc = item.desc || "";
            const author = item.author?.nickname || "Douyin Movie Channel";
            const secUid = item.author?.sec_uid || "";
            const diggCount = item.statistics?.digg_count || 0;
            const commentCount = item.statistics?.comment_count || 0;
            const shareCount = item.statistics?.share_count || 0;
            const createTime = item.create_time ? new Date(item.create_time * 1000).toISOString() : "";
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
              shareUrl,
            });

            console.log(`[Crawl Progress] (${itemsMap.size}/30) AwemeID: ${awemeId} | Tác giả: ${author} | Mô tả: ${desc.substring(0, 35)}...`);
            saveFiles();
          }
        }
      } catch {}
    }
  });

  const channels = [
    { secUid: "MS4wLjABAAAAIbZl6OZqoVvD1n_-KY970TKm--3hC96F-kKan96tfpiH2kNlb59ANK4qjgzvGKOw", name: "龙飞电影" },
    { secUid: "MS4wLjABAAAAWwZuKyVx0TlTbfZY02KgY_jygqoo3VpH7NPEtZribswIaQf_G37b2tXquSFuuXzx", name: "余年电影" },
    { secUid: "MS4wLjABAAAAuheuPTyQhXiwJJtUsrcf6LPHT3RW_p2OtzCpTnFmdJVXkVZBC08qPFnB637b_qRJ", name: "大象电影" },
    { secUid: "MS4wLjABAAAASkxsFTxQvQM_cMyAkjPls2s77C5YfjH4Hu_etURru4c", name: "猴哥影库" },
    { secUid: "MS4wLjABAAAAj0-jIdiYhtHLzQC96q-vN4-GTzAY10QBkp7TguiTyfGNJf2v6txsQV8Tl0U3ICQi", name: "三蛋影视" },
    { secUid: "MS4wLjABAAAAURWEn9gtctJycTQYmk2PeCUL2XWNIK-WRINPieH3zL1yKBz4ImOsTg8aHSszlOZs", name: "港电影" }
  ];

  for (const ch of channels) {
    console.log(`\n[Navigating Channel] Mở trang kênh phim: "${ch.name}" ...`);
    const chUrl = `https://www.douyin.com/user/${ch.secUid}`;
    await page.goto(chUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3500);

    for (let scroll = 0; scroll < 3; scroll++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(2000);
    }
  }

  saveFiles();

  console.log(`\n=============================================================`);
  console.log(`🎉 THÀNH CÔNG! Đã crawl đủ ${itemsMap.size} Douyin Creatives Phim Ma / Phim Review.`);
  console.log(`- File CSV:  ${csvPath}`);
  console.log(`- File JSON: ${jsonPath}`);
  console.log(`=============================================================\n`);

  await page.waitForTimeout(2000);
  await context.close();
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
