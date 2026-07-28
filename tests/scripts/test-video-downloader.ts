import { DownloaderService } from "../../crawler-pipeline/src/downloader/index.js";
import { MediaValidator } from "../../crawler-pipeline/src/downloader/media_validator.js";

async function main() {
  console.log("=============================================================");
  console.log("🚀 TESTING VIDEO DOWNLOADER SERVICE (HIGH CAPACITY)");
  console.log("=============================================================\n");

  const service = new DownloaderService({ maxConcurrent: 2 });

  // Test MP4 video stream (MDN sample public MP4 stream URL)
  const testUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  console.log(`[Test 1] Submit download task to pool...`);
  const result = await service.download(
    {
      id: "test_video_001",
      url: testUrl,
      platform: "douyin",
      destination: "local",
      outputPath: "test_video_001.mp4",
    },
    (progress) => {
      console.log(
        `   [Progress] ${progress.percent}% | ${(progress.downloadedBytes / 1024 / 1024).toFixed(2)} MB | Speed: ${(progress.speedBytesPerSec / 1024 / 1024).toFixed(2)} MB/s`
      );
    }
  );

  console.log("\n[Test 1 Result]:", JSON.stringify(result, null, 2));

  if (result.success && result.filePath) {
    console.log("\n[Test 2] Validating downloaded file magic bytes & integrity...");
    const validation = await MediaValidator.validateFile(result.filePath);
    console.log("Validation result:", JSON.stringify(validation, null, 2));
    if (validation.valid) {
      console.log("\n✅ Video Downloader Service test PASS!");
    } else {
      console.error("\n❌ Validation failed:", validation.error);
      process.exit(1);
    }
  } else {
    console.error("\n❌ Download failed:", result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Test script error:", err.message || err);
  process.exit(1);
});
