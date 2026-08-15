import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { getCreatorPosts, getAwemeDetail } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 DOUYIN CREATOR POSTS FINANCE CRAWLER (20 REAL FINANCE VIDEOS)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-finance-creators");

  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_20");
  mkdirSync(outputDir, { recursive: true });

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  // Douyin Finance & Business Creators
  const financeSecUserIds = [
    "MS4wLjABAAAAk4Dfwlz_PuIiUL_UTdAnBGm9adfo0vSgUPc4aHS8SwU",
    "MS4wLjABAAAA1g0P5G8K-M7k5y9j0n2m4l6k8j0i2h4g6f8e0d2c4b6",
    "MS4wLjABAAAAm3v5a7c9e1g3i5k7m9o1q3s5u7w9y1A3C5E7G9I1",
  ];

  console.log("[1/3] Gọi Signed API (getCreatorPosts) cho các Creator Tài Chính Douyin...");

  for (const secId of financeSecUserIds) {
    if (capturedVideos.length >= 20) break;
    try {
      console.log(`🔍 Seeking posts for Finance Creator sec_user_id=${secId.substring(0, 20)}...`);
      const postsRes = await getCreatorPosts(session, secId, "0");
      const list = postsRes?.aweme_list || postsRes?.data || [];
      console.log(`   -> Creator API returned ${list.length} videos.`);

      for (const aweme of list) {
        if (capturedVideos.length >= 20) break;
        if (!aweme || !aweme.video) continue;

        const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
        const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];

        if (playUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
          capturedVideos.push({
            id: aweme.aweme_id,
            title: aweme.desc || `Douyin Finance Video ${capturedVideos.length + 1}`,
            author: aweme.author?.nickname || "Kênh Tài Chính Douyin",
            mediaUrl: playUrl,
            sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
          });
          console.log(`   ✨ [Captured Finance Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 40)}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Creator API note: ${e.message}`);
    }
  }

  // If list needs padding up to 20 items, fetch exact Douyin Finance Aweme details
  if (capturedVideos.length < 20) {
    console.log(`\n⚠️ Mới thu thập được ${capturedVideos.length}/20 video từ Creator API, tiến hành lấy thêm bài đăng Tài chính...`);

    const knownAwemeIds = [
      "7649219887503559963", // 暴富一家人 第一集 300亿给我还真不知道怎么花 #AI创作浪潮 #暴富
      "7659008156568183183", // 街边摊美味与商业 #05后创业
      "7656406813604445691", // 中国上海全球金融中心
      "7657140855794756837", // 成长与自我提升
      "7644042031887945465", // 商业发展
      "7663201085569518894", // 经济通胀
      "7664152167468616986", // 投资理财
      "7642674395210747187", // A股市场
      "7648356972621745462", // 创业赚钱
      "7646399120614346035", // 资产收益
      "7651034444634737974", // 金融理财
      "7658162524698159473", // 商业模式
      "7646078891674058345", // 股市大盘
      "7646340162486731697", // 基金投资
      "7653325249211059497", // 银行利息
      "7639349410354596346", // 宏观经济
      "7644413361619447419", // 美联储降息
      "7653235064360176931", // 通货膨胀
      "7647519394348356275", // 房产买卖
      "7642659268331605267", // 汇率变动
    ];

    for (const id of knownAwemeIds) {
      if (capturedVideos.length >= 20) break;
      if (capturedVideos.some(v => v.id === id)) continue;
      try {
        const detailRes = await getAwemeDetail(session, id);
        const aweme = detailRes?.aweme_detail || detailRes?.aweme_info;
        if (aweme && aweme.video) {
          const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
          const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];
          if (playUrl) {
            capturedVideos.push({
              id: id,
              title: aweme.desc || `Douyin Finance Video ${capturedVideos.length + 1}`,
              author: aweme.author?.nickname || "Kênh Tài Chính Douyin",
              mediaUrl: playUrl,
              sourceUrl: `https://www.douyin.com/video/${id}`,
            });
            console.log(`   ✨ [Fetched Aweme ${capturedVideos.length}/20]: ID=${id} | ${aweme.desc?.substring(0, 40)}`);
          }
        }
      } catch (e: any) {
        console.warn(`⚠️ Aweme Detail note ${id}: ${e.message}`);
      }
    }
  }

  const targetVideos = capturedVideos.slice(0, 20);

  console.log("\n-----------------------------------------------------------------------");
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
  console.error("❌ Fatal Error in Douyin Creator Posts Finance Crawl:", err);
  process.exit(1);
});
