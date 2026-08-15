/**
 * # Type definitions cho dữ liệu API response của Weibo
 * Ánh xạ từ ChinaMediaCrawler models.py: WeiboNote, WeiboNoteComment, WeiboCreator
 */

export interface WeiboAuthor {
  id?: number;
  screen_name?: string;
  profile_image_url?: string;
  gender?: string;
  profile_url?: string;
  ip_location?: string;
}

export interface WeiboNote {
  id?: number;
  mblogid?: string;
  text_raw?: string;
  created_at?: string;
  attitudes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  user?: WeiboAuthor;
  page_info?: {
    media_info?: {
      stream_url?: string;
    };
  };
  pic_ids?: string[];
  pic_infos?: Record<string, {
    large?: { url?: string };
    original?: { url?: string };
  }>;
}

export interface WeiboComment {
  id?: number;
  rootid?: number;
  text_raw?: string;
  created_at?: string;
  like_count?: number;
  total_number?: number;
  user?: {
    id?: number;
    screen_name?: string;
    profile_image_url?: string;
    gender?: string;
    profile_url?: string;
    ip_location?: string;
  };
}

export interface WeiboCreator {
  id?: number;
  screen_name?: string;
  profile_image_url?: string;
  ip_location?: string;
  description?: string;
  gender?: string;
  follow_count?: number;
  followers_count?: number;
  verified_reason?: string;
}
