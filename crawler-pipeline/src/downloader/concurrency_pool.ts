import { DownloadTask, DownloadResult, ProgressCallback } from "./types.js";

type TaskRunner = (task: DownloadTask, onProgress?: ProgressCallback) => Promise<DownloadResult>;

interface QueueItem {
  task: DownloadTask;
  runner: TaskRunner;
  onProgress?: ProgressCallback;
  resolve: (value: DownloadResult) => void;
  reject: (reason?: any) => void;
}

/**
 * # Concurrency Pool
 * Quản lý hàng đợi chạy đa luồng các task tải video số lượng lớn
 */
export class ConcurrencyPool {
  private readonly maxConcurrent: number;
  private activeCount = 0;
  private readonly queue: QueueItem[] = [];

  constructor(maxConcurrent = 4) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  /**
   * # Thêm task vào pool và thực thi khi có slot trống
   */
  execute(
    task: DownloadTask,
    runner: TaskRunner,
    onProgress?: ProgressCallback
  ): Promise<DownloadResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        runner,
        onProgress,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;

    try {
      const result = await item.runner(item.task, item.onProgress);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}
