/**
 * # Các enum và hằng số dùng chung cho toàn bộ crawler pipeline
 */

export enum PlatformType {
  DOUYIN = "douyin",
  TIKTOK = "tiktok",
  XHS = "xhs",
  BILIBILI = "bilibili",
  KUAISHOU = "kuaishou",
  WEIBO = "weibo",
  TIEBA = "tieba",
  ZHIHU = "zhihu",
}

export enum CrawlType {
  SEARCH = "search",
  DETAIL = "detail",
  CREATOR = "creator",
  COMMENTS = "comments",
}

export enum SortType {
  DEFAULT = 0,
  NEWEST = 1,
  MOST_LIKED = 2,
}

export enum MediaType {
  VIDEO = "video",
  IMAGE = "image",
  AVATAR = "avatar",
  COVER = "cover",
}

/**
 * # Loại nội dung Zhihu (câu trả lời, bài viết, video)
 */
export enum ZhihuContentType {
  ANSWER = "answer",
  ARTICLE = "article",
  VIDEO = "zvideo",
}

/**
 * # URL gốc của từng nền tảng
 */
export const PLATFORM_URLS: Record<PlatformType, string> = {
  [PlatformType.DOUYIN]: "https://www.douyin.com",
  [PlatformType.TIKTOK]: "https://www.tiktok.com",
  [PlatformType.XHS]: "https://www.xiaohongshu.com",
  [PlatformType.BILIBILI]: "https://www.bilibili.com",
  [PlatformType.KUAISHOU]: "https://www.kuaishou.com",
  [PlatformType.WEIBO]: "https://weibo.com",
  [PlatformType.TIEBA]: "https://tieba.baidu.com",
  [PlatformType.ZHIHU]: "https://www.zhihu.com",
} as const;

/**
 * # URL bổ sung đặc thù cho Zhihu (chuyên mục)
 */
export const ZHIHU_ZHUANLAN_URL = "https://zhuanlan.zhihu.com";

export const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const CRAWL_DEFAULTS = {
  maxPage: 20,
  maxComments: 50,
  sleepMs: 1500,
  browserRecycleThreshold: 50,
  requestTimeoutMs: 30000,
} as const;

