/**
 * # Type definitions cho dữ liệu API response của Xiaohongshu (XHS)
 * Ánh xạ từ ChinaMediaCrawler models.py: XhsNote, XhsNoteComment, XhsCreator
 */

export interface XhsImageInfo {
  url?: string;
  width?: number;
  height?: number;
  url_default?: string;
}

export interface XhsAuthor {
  user_id?: string;
  nickname?: string;
  avatar?: string;
  ip_location?: string;
}

export interface XhsNote {
  note_id?: string;
  type?: string;
  title?: string;
  desc?: string;
  video_url?: string;
  time?: number;
  last_update_time?: number;
  liked_count?: number;
  collected_count?: number;
  comment_count?: number;
  share_count?: number;
  image_list?: XhsImageInfo[];
  tag_list?: Array<{ name?: string; id?: string }>;
  note_url?: string;
  xsec_token?: string;
  user?: XhsAuthor;
}

export interface XhsNoteComment {
  id?: string;
  note_id?: string;
  content?: string;
  create_time?: number;
  sub_comment_count?: number;
  like_count?: number;
  pictures?: string;
  parent_comment_id?: string;
  user_info?: {
    user_id?: string;
    nickname?: string;
    image?: string;
    ip_location?: string;
  };
}

export interface XhsCreator {
  user_id?: string;
  nickname?: string;
  avatar?: string;
  ip_location?: string;
  desc?: string;
  gender?: string;
  follows?: string;
  fans?: string;
  interaction?: string;
  tag_list?: string;
}
