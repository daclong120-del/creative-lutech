/**
 * # Enums và types đặc thù Bilibili
 */

export enum BiliSearchType {
  VIDEO = "video",
  BANGUMI = "media_bangumi",
  USER = "bili_user",
  ARTICLE = "article",
}

export enum BiliSortType {
  DEFAULT = "",
  MOST_PLAYED = "click",
  NEWEST = "pubdate",
  MOST_DANMAKU = "dm",
  MOST_COLLECTED = "stow",
}

export interface BiliVideoInfo {
  bvid: string;
  aid: number;
}

export interface BiliCreatorInfo {
  mid: number;
}
