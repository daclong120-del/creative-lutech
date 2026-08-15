import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { searchAweme } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🎯 SIGNED SEARCH API CRAWLER: 20 REAL FINANCE VIDEOS (财经)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-signed-search");

  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_20");
  mkdirSync(outputDir, { recursive: true });

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  const keywords = ["财经", "理财", "股票", "投资", "经济", "金融", "商业", "创业", "A股", "港股"];

  console.log("[1/2] Gọi Signed Search API (/aweme/v1/web/general/search/stream/) cho các từ khóa Tài chính...");

  for (const kw of keywords) {
    if (capturedVideos.length >= 20) break;
    try {
      console.log(`🔍 Seeking search results for keyword: "${kw}"...`);
      const searchRes = await searchAweme(session, kw, 0);
      const dataList = searchRes?.data || searchRes?.aweme_list || [];
      console.log(`   -> Payload returned ${dataList.length} items for keyword "${kw}".`);

      for (const item of dataList) {
        if (capturedVideos.length >= 20) break;
        const aweme = item.aweme_info || item;
        if (!aweme || !aweme.video) continue;

        const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
        const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];

        if (playUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
          capturedVideos.push({
            id: aweme.aweme_id,
            title: aweme.desc || `Douyin Video Tài Chính ${capturedVideos.length + 1}`,
            author: aweme.author?.nickname || "Kênh Tài Chính Douyin",
            mediaUrl: playUrl,
            sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
          });
          console.log(`   ✨ [Captured Finance Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 40)}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Search API note for keyword "${kw}": ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Total Finance Videos Captured: ${capturedVideos.length} items.\n`);

  if (capturedVideos.length === 0) {
    console.error("❌ Chưa thu thập được video từ Search API.");
    process.exit(1);
  }

  const targetVideos = capturedVideos.slice(0, 20);

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
  console.error("❌ Fatal Error in Signed Search API Crawl:", err);
  process.exit(1);
});
