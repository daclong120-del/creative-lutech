/**
 * # Enums và types đặc thù Zhihu (知乎)
 */

export enum ZhihuSearchType {
  GENERAL = "general",
  ARTICLE = "article",
  QUESTION = "question",
  USER = "user",
}

export enum ZhihuSortType {
  DEFAULT = "default",
  NEWEST = "created_time",
  MOST_UPVOTED = "upvoted_count",
}

export interface ZhihuAnswerInfo {
  answerId: string;
  questionId: string;
}

export interface ZhihuCreatorInfo {
  urlToken: string;
}
