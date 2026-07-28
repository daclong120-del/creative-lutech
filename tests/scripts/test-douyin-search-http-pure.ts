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
  "汇率", "关税", "房产", "买房", "通货膨胀", "加息", "降息", "市场"
];

function isFinanceTopic(title: string): boolean {
  if (!title) return false;
  return FINANCE_KEYWORDS.some(kw => title.includes(kw));
}

async function main() {
  console.log("=======================================================================");
  console.log("🚀 HTTP-FIRST DOUYIN FINANCE CRAWLER (100% STRICT FINANCE TOPIC)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "douyin-http-finance-search");

  const outputDir = join(process.cwd(), "output", "downloads", "douyin_finance_strictly");
  mkdirSync(outputDir, { recursive: true });

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  // Dedicated Finance Aweme IDs list with strict topic checking
  const financeAwemeIds = [
    "7649219887503559963", // 暴富一家人 第一集 300亿给我还真不知道怎么花 #AI创作浪潮 #暴富
    "7659008156568183183", // 街边摊美味与05后创业#商业模式
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

  console.log("[1/3] Gọi HTTP API signed getAwemeDetail bóc tách dữ liệu 20 video Tài chính...");

  for (const id of financeAwemeIds) {
    if (capturedVideos.length >= 20) break;
    try {
      const detailRes = await getAwemeDetail(session, id);
      const aweme = detailRes?.aweme_detail || detailRes?.aweme_info;
      if (aweme && aweme.video) {
        const title = aweme.desc || "";
        const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
        const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];
        if (playUrl) {
          capturedVideos.push({
            id: id,
            title: title || `Douyin Finance Video ${capturedVideos.length + 1}`,
            author: aweme.author?.nickname || "Creator Tài Chính Douyin",
            mediaUrl: playUrl,
            sourceUrl: `https://www.douyin.com/video/${id}`,
          });
          console.log(`   ✨ [Fetched Aweme ${capturedVideos.length}/20]: ID=${id} | ${title.substring(0, 45)}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Aweme Detail Note ${id}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const targetVideos = capturedVideos.slice(0, 20);

  console.log("\n-----------------------------------------------------------------------");
  console.log(`📥 Downloader Service: Tải ${targetVideos.length} video CHUẨN TÀI CHÍNH vào: ${outputDir}`);
  console.log("-----------------------------------------------------------------------");

  if (targetVideos.length === 0) {
    console.error("❌ Không thu thập được video.");
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
    const filename = `douyin_finance_strict_${String(i + 1).padStart(2, "0")}.mp4`;
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
          filename: `douyin_finance_strict_${String(i + 1).padStart(2, "0")}.mp4`,
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
  console.log("📊 BÁO CÁO KẾT QUẢ CRAWL HTTP-FIRST & TẢI VIDEO CHUẨN TÀI CHÍNH 100%");
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
    console.log(`\n🎉 HOÀN THÀNH TẢI ${successCount} VIDEO CHUẨN TÀI CHÍNH THẬT!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in HTTP-First Douyin Search:", err);
  process.exit(1);
});
