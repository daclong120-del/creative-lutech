/**
 * # Tiện ích thời gian cho crawler pipeline
 */

/**
 * # Dừng luồng trong khoảng thời gian chỉ định (milliseconds)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * # Dừng luồng ngẫu nhiên trong khoảng min-max milliseconds
 */
export function randomSleep(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return sleep(ms);
}

/**
 * # Chuyển Unix timestamp (giây) sang ISO string
 */
export function unixToIso(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * # Chuyển Unix timestamp (milliseconds, 13 chữ số) sang ISO string
 * Ánh xạ từ ChinaMediaCrawler tools/time_util.py get_time_str_from_unix_time
 */
export function unixMsToIso(timestampMs: number): string {
  if (timestampMs > 1_000_000_000_000) {
    return new Date(timestampMs).toISOString();
  }
  return new Date(timestampMs * 1000).toISOString();
}

/**
 * # Lấy timestamp hiện tại dạng giây
 */
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * # Lấy timestamp hiện tại dạng milliseconds (13 chữ số)
 * Ánh xạ từ ChinaMediaCrawler tools/time_util.py get_current_timestamp
 */
export function nowUnixMs(): number {
  return Date.now();
}

/**
 * # Format duration từ milliseconds sang chuỗi dễ đọc
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}m${remainSeconds}s`;
}

/**
 * # Chuyển chuỗi ngày RFC 2822 (dùng bởi Weibo) sang ISO string
 * Ánh xạ từ ChinaMediaCrawler tools/time_util.py rfc2822_to_china_datetime
 * Ví dụ: "Sat Dec 23 17:12:54 +0800 2023" → "2023-12-23T09:12:54.000Z"
 */
export function rfc2822ToIso(rfc2822: string): string {
  try {
    return new Date(rfc2822).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

