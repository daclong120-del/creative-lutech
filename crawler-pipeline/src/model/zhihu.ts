/**
 * # Type definitions cho dữ liệu API response của Zhihu
 * Ánh xạ từ ChinaMediaCrawler models.py: ZhihuContent, ZhihuComment, ZhihuCreator
 */

export interface ZhihuAuthor {
  id?: string;
  url_token?: string;
  name?: string;
  avatar_url?: string;
  headline?: string;
  gender?: number;
  ip_info?: string;
}

export interface ZhihuContent {
  id?: number;
  type?: string;
  content?: string;
  url?: string;
  question?: {
    id?: number;
    title?: string;
  };
  title?: string;
  excerpt?: string;
  created_time?: number;
  updated_time?: number;
  voteup_count?: number;
  comment_count?: number;
  author?: ZhihuAuthor;
}

export interface ZhihuComment {
  id?: number;
  content?: string;
  created_time?: number;
  like_count?: number;
  dislike_count?: number;
  child_comment_count?: number;
  reply_comment_id?: number;
  author?: {
    member?: {
      id?: string;
      url_token?: string;
      name?: string;
      avatar_url?: string;
    };
  };
  resource_type?: string;
}

export interface ZhihuCreator {
  id?: string;
  url_token?: string;
  name?: string;
  avatar_url?: string;
  gender?: number;
  ip_info?: string;
  follower_count?: number;
  following_count?: number;
  answer_count?: number;
  articles_count?: number;
  voteup_count?: number;
  question_count?: number;
  columns_count?: number;
  zvideo_count?: number;
}
