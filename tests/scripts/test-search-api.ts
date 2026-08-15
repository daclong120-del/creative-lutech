import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { searchAweme } from "../../crawler-pipeline/src/crawl/douyin/api.js";

async function main() {
  console.log("=============================================================");
  console.log("🚀 TESTING DOUYIN SEARCH API FOR PHIM MA (恐怖电影)");
  console.log("=============================================================\n");

  const sessionPath = join(process.cwd(), "output", "session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ session.json missing!");
    process.exit(1);
  }

  const rawSession = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawSession, "local");

  console.log(`- WebId:   ${session.webid}`);
  console.log(`- MsToken: ${session.msToken.substring(0, 15)}...`);
  console.log(`- Cookies: ${session.cookies?.length || 0} items\n`);

  const keywords = ["恐怖电影", "鬼片", "僵尸片", "惊悚电影", "悬疑片", "林正英"];
  const allResults: any[] = [];
  const itemsMap = new Map<string, any>();

  for (const kw of keywords) {
    console.log(`[HTTP Search] Calling searchAweme for keyword "${kw}"...`);
    try {
      const res = await searchAweme(session, kw, 0);
      const dataList = res.data || res.aweme_list || [];
      console.log(`- Response status_code: ${res.status_code}, data length: ${dataList.length}`);

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
          const shareUrl = `https://www.douyin.com/video/${awemeId}`;

          const record = {
            awemeId,
            keyword: kw,
            desc,
            author,
            secUid,
            diggCount,
            commentCount,
            shareCount,
            createTime,
            shareUrl
          };
          itemsMap.set(awemeId, record);
          allResults.push(record);
        }
      }
    } catch (e: any) {
      console.error(`- Lỗi search "${kw}": ${e.message}`);
    }
  }

  console.log(`\n🎉 Tổng số video phim ma thu thập được: ${itemsMap.size}`);

  const outputDir = join(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  const csvPath = join(outputDir, "phim_ma_creatives.csv");
  const jsonPath = join(outputDir, "phim_ma_creatives.json");

  const results = Array.from(itemsMap.values());
  writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf8");

  const csvHeaders = "awemeId,keyword,desc,author,secUid,diggCount,commentCount,shareCount,createTime,shareUrl\n";
  const csvRows = results.map(r => {
    const safeDesc = `"${(r.desc || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const safeAuthor = `"${(r.author || "").replace(/"/g, '""')}"`;
    return `${r.awemeId},"${r.keyword}",${safeDesc},${safeAuthor},${r.secUid},${r.diggCount},${r.commentCount},${r.shareCount},${r.createTime},${r.shareUrl}`;
  }).join("\n");

  writeFileSync(csvPath, csvHeaders + csvRows, "utf8");

  console.log(`- File CSV:  ${csvPath}`);
  console.log(`- File JSON: ${jsonPath}`);
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
