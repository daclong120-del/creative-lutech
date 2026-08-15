/**
 * # Enums và types đặc thù Weibo (微博)
 */

export enum WeiboSearchType {
  DEFAULT = "1",
  REALTIME = "61",
  POPULAR = "60",
  VIDEO = "64",
}

export interface WeiboPostInfo {
  mblogId: string;
}

export interface WeiboCreatorInfo {
  userId: string;
}
