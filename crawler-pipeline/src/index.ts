/**
 * # File entrypoint khởi chạy CLI và Queue Worker
 */

import { join } from "node:path";
import { CrawlerFactory } from "./crawl/crawler_factory.js";
import { PlatformType } from "./constant/index.js";

/**
 * # Tự động nhận diện nền tảng từ URL hoặc chuỗi target
 */
function detectPlatform(target: string): PlatformType {
  const lower = target.toLowerCase();
  if (lower.includes("bilibili.com") || lower.includes("b23.tv") || target.startsWith("BV") || /^\d+$/.test(target)) {
    return PlatformType.BILIBILI;
  }
  if (lower.includes("zhihu.com")) {
    return PlatformType.ZHIHU;
  }
  if (lower.includes("weibo.com") || lower.includes("weibo.cn")) {
    return PlatformType.WEIBO;
  }
  if (lower.includes("tieba.baidu.com")) {
    return PlatformType.TIEBA;
  }
  if (lower.includes("kuaishou.com")) {
    return PlatformType.KUAISHOU;
  }
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) {
    return PlatformType.XHS;
  }
  return PlatformType.DOUYIN;
}

/**
 * # Hàm chạy chính của ứng dụng
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    let platformArg: string | null = null;
    
    const platformIndex = args.findIndex(arg => arg === "-p" || arg === "--platform");
    if (platformIndex !== -1 && args[platformIndex + 1]) {
      platformArg = args[platformIndex + 1];
      args.splice(platformIndex, 2);
    }

    const command = args[0];

    if (command === "bootstrap") {
      throw new Error("Lệnh bootstrap đã bị gỡ bỏ. Vui lòng cung cấp session/cookie hợp lệ.");
    }

    if (command === "crawl") {
      const urlOrId = args[1];
      if (!urlOrId) {
        const { startQueueWorker } = await import("./queue_worker.js");
        await startQueueWorker();
        return;
      }
      const platform = (platformArg as PlatformType) || detectPlatform(urlOrId);
      const crawler = CrawlerFactory.create(platform);
      await crawler.crawl(urlOrId);
      return;
    }

    if (command === "creator") {
      const urlOrSecUid = args[1];
      if (!urlOrSecUid) {
        throw new Error("Vui lòng cung cấp URL kênh hoặc UID cần cào: npm run creator <url_or_uid> [-p platform]");
      }
      const platform = (platformArg as PlatformType) || detectPlatform(urlOrSecUid);
      const crawler = CrawlerFactory.create(platform);
      await crawler.creator(urlOrSecUid);
      return;
    }

    if (command === "search") {
      const keyword = args[1];
      const maxCount = args[2] ? parseInt(args[2], 10) : 20;
      if (!keyword) {
        throw new Error("Vui lòng cung cấp từ khóa tìm kiếm: npm run search <keyword> [max_count] [-p platform]");
      }
      const platform = (platformArg as PlatformType) || PlatformType.DOUYIN;
      const crawler = CrawlerFactory.create(platform);
      await crawler.search(keyword, maxCount);
      return;
    }

    if (command === "comments") {
      const targetId = args[1];
      const maxCount = args[2] ? parseInt(args[2], 10) : 50;
      if (!targetId) {
        throw new Error("Vui lòng cung cấp ID bài viết/video: npm run comments <id> [max_count] [-p platform]");
      }
      const platform = (platformArg as PlatformType) || detectPlatform(targetId);
      const crawler = CrawlerFactory.create(platform);
      await crawler.comments(targetId, maxCount);
      return;
    }

    if (command === "add-account") {
      const platform = args[1];
      const username = args[2];
      const cookieOrFile = args[3];
      if (!platform || !username || !cookieOrFile) {
        throw new Error("Vui lòng cung cấp đầy đủ thông tin: npm run add-account <platform> <username> <cookie_or_json_file_path>");
      }
      let cookieData = cookieOrFile;
      if (cookieOrFile.endsWith(".json")) {
        const { readFileSync } = await import("node:fs");
        const fileContent = readFileSync(cookieOrFile, "utf8");
        try {
          const parsed = JSON.parse(fileContent);
          if (Array.isArray(parsed)) {
            cookieData = parsed.map((c: any) => `${c.name}=${c.value}`).join("; ");
          } else if (parsed.cookie) {
            cookieData = parsed.cookie;
          }
        } catch {
          cookieData = fileContent.trim();
        }
      }
      const { addOrUpdateAccount } = await import("./store/index.js");
      await addOrUpdateAccount(platform, username, cookieData);
      return;
    }

    if (command === "refresh") {
      const { refreshAllMetrics } = await import("./refresh_metrics.js");
      await refreshAllMetrics();
      return;
    }

    if (command === "download") {
      const mediaUrl = args[1];
      if (!mediaUrl) {
        throw new Error("Vui lòng cung cấp URL video cần tải: npx tsx src/index.ts download <media_url> [-p platform]");
      }
      const platform = platformArg || "douyin";
      const { DownloaderService } = await import("./downloader/index.js");
      const service = new DownloaderService();
      console.log(`🚀 Bắt đầu tải video từ URL (${platform}): ${mediaUrl}`);
      const res = await service.download({
        id: `cli_${Date.now()}`,
        url: mediaUrl,
        platform,
        destination: "local",
      }, (p) => {
        console.log(`[Downloader] Tiến độ: ${p.percent}% (${(p.downloadedBytes / 1024 / 1024).toFixed(2)} MB) - Tốc độ: ${(p.speedBytesPerSec / 1024 / 1024).toFixed(2)} MB/s`);
      });
      if (res.success) {
        console.log(`✅ Tải video thành công! Đường dẫn file: ${res.filePath}`);
      } else {
        console.error(`❌ Tải video thất bại: ${res.error}`);
        process.exit(1);
      }
      return;
    }

    throw new Error("Lệnh không hợp lệ. Các lệnh hỗ trợ: crawl <url_or_id>, creator <url_or_uid>, search <keyword> [max_count], comments <id> [max_count], add-account <platform> <username> <cookie_or_json_file_path>, refresh, download <media_url>");
  } finally {
    // Không còn browser context để dọn dẹp
  }
}

main().catch((err) => {
  console.error("Lỗi:", err.message);
  process.exit(1);
});
