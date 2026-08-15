import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { getSelfProfile } from "../../crawler-pipeline/src/crawl/douyin/api.js";
import { buildHeaders, douyinGet } from "../../crawler-pipeline/src/crawl/douyin/http_client.js";
import { DownloaderService, MediaValidator } from "../../crawler-pipeline/src/downloader/index.js";

async function main() {
  console.log("=======================================================================");
  console.log("🚀 REAL DOUYIN SIGNED API CRAWLER & DOWNLOADER (20 REAL VIDEOS)");
  console.log("=======================================================================\n");

  const sessionPath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  if (!existsSync(sessionPath)) {
    console.error("❌ Thiếu session file tại:", sessionPath);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(rawData, "real-douyin-signed-crawl");

  console.log(`✅ Nạp session định danh thành công: WebId=${session.webid}`);

  // Heartbeat verification
  let profileName = "LoggedUser";
  try {
    const profile = await getSelfProfile(session);
    if (profile?.user?.nickname) {
      profileName = profile.user.nickname;
      console.log(`✅ Session Heartbeat OK! Logged user: ${profileName}\n`);
    }
  } catch (e: any) {
    console.warn(`⚠️ Heartbeat check note: ${e.message}\n`);
  }

  const capturedVideos: Array<{ id: string; title: string; author: string; mediaUrl: string; sourceUrl: string }> = [];

  // 1. Lặp lấy 20 video từ Douyin Recommend Feed & Search APIs
  let pageIndex = 1;
  while (capturedVideos.length < 20 && pageIndex <= 15) {
    try {
      console.log(`🔍 [Lần ${pageIndex}/15] Gọi Douyin API Recommend Feed cho user (${profileName})...`);
      const feedRes = await douyinGet(
        "/aweme/v1/web/tab/feed/",
        { count: "20", refresh_type: "1" },
        session,
        { sign: true }
      );
      const feedList = feedRes?.aweme_list || feedRes?.data || [];
      for (const item of feedList) {
        const aweme = item.aweme_info || item;
        if (!aweme || !aweme.video) continue;
        const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
        const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];
        if (playUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
          capturedVideos.push({
            id: aweme.aweme_id,
            title: aweme.desc || `Douyin Real Video ${capturedVideos.length + 1}`,
            author: aweme.author?.nickname || "Douyin Creator",
            mediaUrl: playUrl,
            sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
          });
          console.log(`   ✨ [Captured Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 35)}`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Feed API note: ${e.message}`);
    }

    if (capturedVideos.length < 20) {
      try {
        console.log(`🔍 Gọi Douyin Search API từ khóa Tài chính (财经)...`);
        const searchRes = await douyinGet(
          "/aweme/v1/web/general/search/stream/",
          { keyword: "财经", count: "15", offset: String((pageIndex - 1) * 15) },
          session,
          { sign: true }
        );
        const searchList = searchRes?.data || searchRes?.aweme_list || [];
        for (const item of searchList) {
          const aweme = item.aweme_info || item;
          if (!aweme || !aweme.video) continue;
          const urlList = aweme.video?.play_addr?.url_list || aweme.video?.play_addr_h264?.url_list || [];
          const playUrl = urlList.find((u: string) => u.includes("douyin.com/aweme/v1/play")) || urlList[0];
          if (playUrl && !capturedVideos.some(v => v.id === aweme.aweme_id)) {
            capturedVideos.push({
              id: aweme.aweme_id,
              title: aweme.desc || `Douyin Finance Video ${capturedVideos.length + 1}`,
              author: aweme.author?.nickname || "Douyin Creator",
              mediaUrl: playUrl,
              sourceUrl: `https://www.douyin.com/video/${aweme.aweme_id}`,
            });
            console.log(`   ✨ [Captured Finance Search Video ${capturedVideos.length}/20]: ID=${aweme.aweme_id} | ${aweme.desc?.substring(0, 35)}`);
          }
        }
      } catch (e: any) {
        console.warn(`⚠️ Search API note: ${e.message}`);
      }
    }
    pageIndex++;
    await new Promise(r => setTimeout(r, 1000));
  }

  const outputDir = join(process.cwd(), "output", "downloads", "real_douyin");
  mkdirSync(outputDir, { recursive: true });

  console.log(`\n=======================================================================`);
  console.log(`📥 Bắt đầu tải ${capturedVideos.length} video Douyin CDN thật vào: ${outputDir}`);
  console.log(`=======================================================================\n`);

  if (capturedVideos.length === 0) {
    console.error("❌ Chưa có URL video CDN thật từ Douyin API.");
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

  const tasks = capturedVideos.map((v, i) => {
    const filename = `real_douyin_${String(i + 1).padStart(2, "0")}.mp4`;
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
          console.log(`   [Task ${i + 1}/${capturedVideos.length} PASS] ${filename} (${(p.downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
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
    const v = capturedVideos[i];
    if (r.success && r.filePath) {
      const val = await MediaValidator.validateFile(r.filePath);
      if (val.valid) {
        successCount++;
        totalBytes += r.fileSize;
        report.push({
          index: i + 1,
          filename: `real_douyin_${String(i + 1).padStart(2, "0")}.mp4`,
          title: v.title,
          sizeMb: (r.fileSize / 1024 / 1024).toFixed(2),
          checksum: val.checksum,
          filePath: r.filePath,
          status: "PASS",
        });
      }
    }
  }

  console.log("\n=======================================================================");
  console.log("📊 BÁO CÁO CRAWL & TẢI VIDEO DOUYIN THẬT (SIGNED API + DOWNLOADER)");
  console.log("=======================================================================");
  console.log(`- Thành công: ${successCount}/${capturedVideos.length} videos`);
  console.log(`- Dung lượng: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Thời gian thực thi pool: ${totalDuration}ms\n`);

  console.table(report.map(r => ({
    "STT": r.index,
    "Tên File": r.filename,
    "Tiêu Đề Bài Đăng": r.title.substring(0, 35),
    "Size (MB)": r.sizeMb,
    "MD5 Checksum": r.checksum,
    "Trạng Thái": r.status,
  })));

  if (successCount > 0) {
    console.log(`\n🎉 THỰC THI CRAWL VÀ TẢI VIDEO DOUYIN THẬT THÀNH CÔNG!`);
    process.exit(0);
  } else {
    console.error("\n❌ Chưa có video Douyin CDN thật được tải về đĩa.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error in Real Douyin Signed Crawl:", err);
  process.exit(1);
});
