/**
 * # Enums và types đặc thù Douyin cho tìm kiếm, lọc, phân loại
 * Tương đương media_platform/douyin/field.py trong ChinaMediaCrawler
 */

/**
 * # Loại kênh tìm kiếm trên Douyin
 */
export enum SearchChannelType {
  GENERAL = "aweme_general",
  VIDEO = "aweme_video_web",
  USER = "aweme_user_web",
  LIVE = "aweme_live",
}

/**
 * # Cách sắp xếp kết quả tìm kiếm
 */
export enum SearchSortType {
  GENERAL = 0,
  MOST_LIKE = 1,
  LATEST = 2,
}

/**
 * # Lọc theo thời gian đăng
 */
export enum PublishTimeType {
  UNLIMITED = 0,
  ONE_DAY = 1,
  ONE_WEEK = 7,
  SIX_MONTH = 180,
}

/**
 * # Loại nội dung bài đăng Douyin
 */
export enum AwemeType {
  VIDEO = "video",
  IMAGE = "image",
  LIVE = "live",
}

/**
 * # Kết quả phân tích URL video
 */
export interface VideoUrlInfo {
  awemeId: string;
  urlType: "normal" | "modal" | "short";
}

/**
 * # Kết quả phân tích URL creator
 */
export interface CreatorUrlInfo {
  secUserId: string;
}
