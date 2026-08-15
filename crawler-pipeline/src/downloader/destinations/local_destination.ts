import { join } from "node:path";
import { DownloadTask, DownloadResult, ProgressCallback } from "../types.js";
import { StreamDownloader } from "../stream_downloader.js";
import { MediaValidator } from "../media_validator.js";

/**
 * # Local Storage Destination
 * Lưu file video trực tiếp vào thư mục đĩa cục bộ
 */
export class LocalDestination {
  private readonly defaultDir: string;
  private readonly downloader: StreamDownloader;

  constructor(defaultDir?: string, downloader?: StreamDownloader) {
    this.defaultDir = defaultDir || join(process.cwd(), "output", "downloads");
    this.downloader = downloader || new StreamDownloader();
  }

  async save(task: DownloadTask, onProgress?: ProgressCallback): Promise<DownloadResult> {
    const filename = task.outputPath || `${task.platform}_${task.id}.mp4`;
    const targetPath = join(this.defaultDir, filename);

    const downloadRes = await this.downloader.downloadToFile(task, targetPath, onProgress);

    const validation = await MediaValidator.validateFile(targetPath);
    if (!validation.valid) {
      throw new Error(`Xác minh file tải về thất bại: ${validation.error}`);
    }

    return {
      ...downloadRes,
      checksum: validation.checksum,
    };
  }
}
