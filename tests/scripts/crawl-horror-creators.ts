import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { douyinGet } from "../../crawler-pipeline/src/crawl/douyin/http_client.js";

async function main() {
  console.log("=============================================================");
  console.log("🚀 CRAWL DOUYIN CREATIVES PHIM MA / KINH DỊ TỪ CHUYÊN KÊNH PHIM");
  console.log("=============================================================\n");

  const sessionPath = join(process.cwd(), "output", "session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ session.json missing!");
    process.exit(1);
  }

  const rawSession = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawSession, "local");

  // Các sec_uid của các kênh chuyên review Phim Ma / Kinh Dị / Phim Giật Gân nổi tiếng trên Douyin
  const horrorCreators = [
    { secUid: "MS4wLjABAAAAIbZl6OZqoVvD1n_-KY970TKm--3hC96F-kKan96tfpiH2kNlb59ANK4qjgzvGKOw", name: "龙飞电影" },
    { secUid: "MS4wLjABAAAAWwZuKyVx0TlTbfZY02KgY_jygqoo3VpH7NPEtZribswIaQf_G37b2tXquSFuuXzx", name: "余年电影" },
    { secUid: "MS4wLjABAAAAuheuPTyQhXiwJJtUsrcf6LPHT3RW_p2OtzCpTnFmdJVXkVZBC08qPFnB637b_qRJ", name: "大象电影" },
    { secUid: "MS4wLjABAAAASkxsFTxQvQM_cMyAkjPls2s77C5YfjH4Hu_etURru4c", name: "猴哥影库" },
    { secUid: "MS4wLjABAAAAj0-jIdiYhtHLzQC96q-vN4-GTzAY10QBkp7TguiTyfGNJf2v6txsQV8Tl0U3ICQi", name: "三蛋影视" },
    { secUid: "MS4wLjABAAAAURWEn9gtctJycTQYmk2PeCUL2XWNIK-WRINPieH3zL1yKBz4ImOsTg8aHSszlOZs", name: "港电影" },
  ];

  const itemsMap = new Map<string, any>();

  const outputDir = join(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  const csvPath = join(outputDir, "phim_ma_creatives.csv");
  const jsonPath = join(outputDir, "phim_ma_creatives.json");

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

  for (const creator of horrorCreators) {
    console.log(`[Crawl Channel] Đang cào danh sách video Phim Ma từ kênh: "${creator.name}" (${creator.secUid.substring(0, 15)}...)...`);
    try {
      const res = await douyinGet(
        "/aweme/v1/web/aweme/post/",
        {
          sec_user_id: creator.secUid,
          count: "18",
          max_cursor: "0",
          locate_query: "false",
          publish_video_strategy_type: "2",
        },
        session,
        { sign: true }
      );

      const dataList = res.aweme_list || [];
      console.log(`- Trả về ${dataList.length} video Phim ma / Review phim.`);

      for (const info of dataList) {
        if (info && info.aweme_id && !itemsMap.has(info.aweme_id)) {
          const awemeId = info.aweme_id;
          const desc = info.desc || "";
          const author = info.author?.nickname || creator.name;
          const secUid = info.author?.sec_uid || creator.secUid;
          const diggCount = info.statistics?.digg_count || 0;
          const commentCount = info.statistics?.comment_count || 0;
          const shareCount = info.statistics?.share_count || 0;
          const createTime = info.create_time ? new Date(info.create_time * 1000).toISOString() : "";
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

          console.log(`  + [Creative Phim Ma ${itemsMap.size}] ${awemeId} | ${author} | ${desc.substring(0, 35)}...`);
          saveFiles();
        }
      }
    } catch (e: any) {
      console.error(`- Lỗi cào kênh ${creator.name}: ${e.message}`);
    }
  }

  saveFiles();

  console.log(`\n=============================================================`);
  console.log(`🎉 HOÀN THÀNH THÀNH CÔNG! Đã crawl đủ ${itemsMap.size} Creatives Phim Ma / Kinh Dị.`);
  console.log(`- File CSV:  ${csvPath}`);
  console.log(`- File JSON: ${jsonPath}`);
  console.log(`=============================================================\n`);
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
