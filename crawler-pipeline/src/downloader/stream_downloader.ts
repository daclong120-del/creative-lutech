import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fetch as undiciFetch } from "undici";
import { DownloadTask, DownloadResult, ProgressCallback } from "./types.js";

/**
 * # Stream Downloader
 * Tải file video dạng stream trực tiếp vào file đĩa (Prevent OOM memory overflow)
 */
export class StreamDownloader {
  private readonly defaultUserAgent: string;

  constructor(defaultUserAgent?: string) {
    this.defaultUserAgent = defaultUserAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  }

  /**
   * # Thực thi download stream trực tiếp vào đường dẫn đích
   */
  async downloadToFile(
    task: DownloadTask,
    targetPath: string,
    onProgress?: ProgressCallback
  ): Promise<DownloadResult> {
    const startTime = Date.now();
    const timeoutMs = task.timeoutMs || 120000;

    // Guard SSRF (HTTPS/HTTP filter)
    const parsedUrl = new URL(task.url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error(`Giao thức URL không hợp lệ: ${parsedUrl.protocol}`);
    }

    // Prepare directory
    const targetDir = dirname(targetPath);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    let downloadUrl = task.url;

    const headers: Record<string, string> = {
      "User-Agent": this.defaultUserAgent,
      "Referer": "https://www.douyin.com/",
      "Accept": "*/*",
      "Accept-Encoding": "identity",
      "Range": "bytes=0-",
      ...task.headers,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await undiciFetch(downloadUrl, {
        headers,
        redirect: "follow",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error status ${response.status}: ${response.statusText}`);
      }

      const contentLengthStr = response.headers.get("content-length");
      const totalBytes = contentLengthStr ? parseInt(contentLengthStr, 10) : 0;
      const mimeType = response.headers.get("content-type") || "video/mp4";

      const fileStream = createWriteStream(targetPath);
      let downloadedBytes = 0;
      let lastReportTime = Date.now();
      let lastReportBytes = 0;

      if (response.body && typeof response.body.getReader === "function") {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fileStream.write(Buffer.from(value));
          downloadedBytes += value.byteLength;

          const now = Date.now();
          const timeDiff = (now - lastReportTime) / 1000;
          if (timeDiff >= 0.5 && onProgress) {
            const speedBytesPerSec = Math.round((downloadedBytes - lastReportBytes) / timeDiff);
            const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            onProgress({
              taskId: task.id,
              downloadedBytes,
              totalBytes,
              speedBytesPerSec,
              percent,
            });
            lastReportTime = now;
            lastReportBytes = downloadedBytes;
          }
        }
      } else {
        const ab = await response.arrayBuffer();
        const buf = Buffer.from(ab);
        fileStream.write(buf);
        downloadedBytes = buf.byteLength;
      }

      await new Promise<void>((resolve, reject) => {
        fileStream.end((err: Error | null | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });

      clearTimeout(timer);

      return {
        success: true,
        taskId: task.id,
        filePath: targetPath,
        fileSize: downloadedBytes,
        mimeType,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      clearTimeout(timer);
      throw new Error(`Download stream thất bại: ${err.message || err}`);
    }
  }
}
