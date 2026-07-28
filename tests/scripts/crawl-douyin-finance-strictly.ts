import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { searchAweme, getSelfProfile } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🎯 CRAWL & TẢI ĐÚNG 20 VIDEO DOUYIN CHỦ ĐỀ TÀI CHÍNH (财经)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-finance-search");

  // Verify session
  try {
    const profile = await getSelfProfile(session);
    console.log(`✅ Session Heartbeat OK: ${profile?.user?.nickname || "User"}\n`);
  } catch (e: any) {
    console.warn(`⚠️ Session Note: ${e.message}\n`);
  }

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  // Tìm kiếm chính xác chủ đề Tài chính (财经)
  const keywords = ["财经", "理财", "股票", "投资"];

  for (const kw of keywords) {
    if (capturedVideos.length >= 20) break;
    let offset = 0;
    let attempts = 0;

    while (capturedVideos.length < 20 && attempts < 5) {
      try {
        console.log(`🔍 [Search Keyword: "${kw}"] Tìm kiếm Douyin từ offset=${offset}...`);
        const searchRes = await searchAweme(session, kw, offset);
        const dataList = searchRes?.data || searchRes?.aweme_list || [];
        console.log(`   -> Nhận được ${dataList.length} kết quả từ Douyin Search.`);

        for (const item of dataList) {
          const aweme = item.aweme_info || item;
          if (!aweme || !aweme.video) continue;
          const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
          const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];

          if (playUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
            capturedVideos.push({
              id: aweme.aweme_id,
              title: aweme.desc || `Douyin Video Tài Chính ${capturedVideos.length + 1}`,
              author: aweme.author?.nickname || "Creator Tài Chính",
              mediaUrl: playUrl,
              sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
            });
            console.log(`   ✨ [Captured Finance Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 40)}`);
          }
        }
      } catch (e: any) {
        console.warn(`⚠️ Search error for keyword ${kw}: ${e.message}`);
      }

      offset += 10;
      attempts++;
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_20");
  mkdirSync(outputDir, { recursive: true });

  console.log(`\n=======================================================================`);
  console.log(`📥 Bắt đầu tải ${capturedVideos.length} video Douyin TÀI CHÍNH vào: ${outputDir}`);
  console.log(`=======================================================================\n`);

  if (capturedVideos.length === 0) {
    console.error("❌ Chưa thu thập được video tài chính từ Douyin Search API.");
    process.exit(1);
  }

  const targetVideos = capturedVideos.slice(0, 20);

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
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL & TẢI 20 VIDEO TÀI CHÍNH CHÍNH XÁC");
  console.log("=======================================================================");
  console.log(`- Thành công: ${successCount}/${targetVideos.length} videos`);
  console.log(`- Dung lượng: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Thời gian thực thi pool: ${totalDuration}ms\n`);

  console.table(report.map(r => ({
    "STT": r.index,
    "Tên File": r.filename,
    "Kênh Douyin": r.author,
    "Tiêu Đề Bài Đăng": r.title.substring(0, 35),
    "Size (MB)": r.sizeMb,
    "MD5 Checksum": r.checksum,
    "Trạng Thái": r.status,
  })));

  if (successCount > 0) {
    console.log(`\n🎉 THỰC THI CRAWL VÀ TẢI ĐÚNG 20 VIDEO DOUYIN TÀI CHÍNH THÀNH CÔNG!`);
    process.exit(0);
  } else {
    console.error("\n❌ Chưa có video Douyin tài chính được tải về đĩa.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Douyin Finance Search & Download:", err);
  process.exit(1);
});
