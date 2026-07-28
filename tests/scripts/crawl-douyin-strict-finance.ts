import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { douyinGet } from "../../crawler-pipeline/src/crawl/douyin/http_client.js";
import { getAwemeDetail } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

const FINANCE_KEYWORDS = [
  "财经", "理财", "股票", "基金", "投资", "股市", "经济", "金钱",
  "金融", "通胀", "美联储", "A股", "港股", "美股", "暴富", "钱",
  "资产", "收益", "利息", "银行", "纳斯达克", "赚钱", "商业", "创业",
  "汇率", "关税", "房产", "买房", "通货膨胀", "加息", "降息"
];

function isFinanceTopic(title: string): boolean {
  if (!title) return false;
  return FINANCE_KEYWORDS.some(kw => title.includes(kw));
}

async function main() {
  console.log("=======================================================================");
  console.log("🎯 STRICT DOUYIN FINANCE TOPIC CRAWLER & DOWNLOADER (20 REAL FINANCE VIDEOS)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-strict-finance");

  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_strictly");
  mkdirSync(outputDir, { recursive: true });

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  console.log("[1/3] Quét Douyin Feed API và lọc 100% video thuộc đúng chủ đề TÀI CHÍNH...");

  let loopCount = 1;
  while (capturedVideos.length < 20 && loopCount <= 40) {
    try {
      console.log(`🔍 [Lần ${loopCount}/40] Gọi Douyin API & áp dụng bộ lọc Tài chính...`);
      const res = await douyinGet(
        "/aweme/v1/web/tab/feed/",
        { count: "20", refresh_type: "1" },
        session,
        { sign: true }
      );
      const list = res?.aweme_list || res?.data || [];

      for (const item of list) {
        if (capturedVideos.length >= 20) break;
        const aweme = item.aweme_info || item;
        if (!aweme || !aweme.video || !aweme.desc) continue;

        const title = aweme.desc;
        // Strict topic validation
        if (isFinanceTopic(title)) {
          const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
          const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];

          if (playUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
            capturedVideos.push({
              id: aweme.aweme_id,
              title: title,
              author: aweme.author?.nickname || "Kênh Tài Chính Douyin",
              mediaUrl: playUrl,
              sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
            });
            console.log(`   ✅ [ACCEPTED FINANCE VIDEO ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${title.substring(0, 45)}`);
          }
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Feed API note: ${e.message}`);
    }
    loopCount++;
    await new Promise(r => setTimeout(r, 400));
  }

  const targetVideos = capturedVideos.slice(0, 20);

  console.log("\n-----------------------------------------------------------------------");
  console.log(`📥 Bắt đầu tải ${targetVideos.length} video Douyin CHUẨN TÀI CHÍNH vào: ${outputDir}`);
  console.log("-----------------------------------------------------------------------");

  if (targetVideos.length === 0) {
    console.error("❌ Chưa đủ video thỏa mãn bộ lọc từ khóa Tài chính.");
    process.exit(1);
  }

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
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL & TẢI 20 VIDEO DOUYIN CHUẨN TÀI CHÍNH (STRICT TOPIC)");
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
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO DOUYIN TÀI CHÍNH CHUẨN 100%!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Douyin Strict Finance Crawl:", err);
  process.exit(1);
});
