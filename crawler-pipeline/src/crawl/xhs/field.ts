/**
 * # Enums và types đặc thù Tiểu Hồng Thư (XHS / 小红书)
 */

export enum XhsSearchSortType {
  GENERAL = "general",
  MOST_POPULAR = "popularity_descending",
  NEWEST = "time_descending",
}

export enum XhsNoteType {
  NORMAL = "normal",
  VIDEO = "video",
}

export interface XhsNoteInfo {
  noteId: string;
  noteType: XhsNoteType;
}

export interface XhsCreatorInfo {
  userId: string;
}
