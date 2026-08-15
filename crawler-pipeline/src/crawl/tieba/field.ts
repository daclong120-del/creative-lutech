/**
 * # Enums và types đặc thù Tieba (百度贴吧)
 */

export enum TiebaSortType {
  DEFAULT = 0,
  NEWEST = 1,
  HOT = 2,
}

export enum TiebaSearchSortType {
  TIME_DESC = "1",
  TIME_ASC = "0",
  RELEVANCE_ORDER = "2",
}

export enum TiebaSearchNoteType {
  MAIN_THREAD = "1",
  FIXED_THREAD = "0",
}

export interface TiebaPostInfo {
  threadId: string;
  forumName: string;
}

export interface TiebaCreatorInfo {
  userId: string;
  userName: string;
}

