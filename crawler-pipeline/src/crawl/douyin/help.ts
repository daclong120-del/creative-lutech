/**
 * # Helper functions đặc thù Douyin — phân tích URL, sinh webid, sinh chữ ký
 * Tương đương media_platform/douyin/help.py trong ChinaMediaCrawler
 */

import type { VideoUrlInfo, CreatorUrlInfo } from "./field.js";

/**
 * # Phân tích URL video Douyin để trích xuất aweme_id
 * Hỗ trợ: URL chuẩn (/video/xxx), URL modal (?modal_id=xxx), link ngắn (v.douyin.com), ID thuần
 */
export function parseVideoInfoFromUrl(url: string): VideoUrlInfo {
  if (/^\d+$/.test(url)) {
    return { awemeId: url, urlType: "normal" };
  }

  if (url.includes("v.douyin.com") || (url.startsWith("http") && url.length < 50 && !url.includes("video"))) {
    return { awemeId: "", urlType: "short" };
  }

  const modalMatch = url.match(/[?&]modal_id=(\d+)/);
  if (modalMatch) {
    return { awemeId: modalMatch[1], urlType: "modal" };
  }

  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) {
    return { awemeId: videoMatch[1], urlType: "normal" };
  }

  throw new Error(`Không thể phân tích ID video từ URL: ${url}`);
}

/**
 * # Phân tích URL creator Douyin để trích xuất sec_user_id
 * Hỗ trợ: URL trang cá nhân (/user/xxx), ID thuần (MS4wLjABAAAA...)
 */
export function parseCreatorInfoFromUrl(url: string): CreatorUrlInfo {
  if (url.startsWith("MS4wLjABAAAA") || (!url.startsWith("http") && !url.includes("douyin.com"))) {
    return { secUserId: url };
  }

  const userMatch = url.match(/\/user\/([^/?]+)/);
  if (userMatch) {
    return { secUserId: userMatch[1] };
  }

  throw new Error(`Không thể phân tích ID creator từ URL: ${url}`);
}

/**
 * # Phân giải link ngắn v.douyin.com thành URL đầy đủ
 */
export async function resolveShortUrl(shortUrl: string): Promise<string> {
  if (!shortUrl.includes("v.douyin.com")) {
    return shortUrl;
  }
  try {
    const res = await fetch(shortUrl, { method: "GET", redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      return res.headers.get("location") || "";
    }
    return "";
  } catch (err) {
    throw new Error(`Lỗi phân giải short URL: ${(err as Error).message}`);
  }
}

/**
 * # Trích xuất các tham số query từ URL thành object
 */
export function extractUrlParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}
