/**
 * # Lỗi tùy chỉnh cho crawler pipeline
 * Tương đương media_platform/douyin/exception.py trong ChinaMediaCrawler
 */

/**
 * # Lỗi khi lấy dữ liệu từ API thất bại
 */
export class DataFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataFetchError";
  }
}

/**
 * # Lỗi khi IP bị chặn do request quá nhanh
 */
export class IPBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IPBlockError";
  }
}

/**
 * # Lỗi khi chữ ký (signature) không hợp lệ hoặc hết hạn
 */
export class SignatureExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignatureExpiredError";
  }
}

/**
 * # Lỗi khi session/cookie hết hạn cần đăng nhập lại
 */
export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * # Lỗi khi media download thất bại
 */
export class MediaDownloadError extends Error {
  public readonly url: string;
  public readonly statusCode?: number;

  constructor(url: string, statusCode?: number, message?: string) {
    super(message || `Không thể tải media từ ${url}, HTTP ${statusCode}`);
    this.name = "MediaDownloadError";
    this.url = url;
    this.statusCode = statusCode;
  }
}
