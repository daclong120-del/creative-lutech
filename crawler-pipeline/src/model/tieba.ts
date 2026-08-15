/**
 * # Type definitions cho dữ liệu API response của Tieba (Baidu Tieba)
 * Ánh xạ từ ChinaMediaCrawler models.py: TiebaNote, TiebaComment, TiebaCreator
 */

export interface TiebaAuthor {
  user_id?: string;
  user_name?: string;
  user_nickname?: string;
  user_link?: string;
  avatar?: string;
  ip_location?: string;
}

export interface TiebaNote {
  note_id?: string;
  title?: string;
  desc?: string;
  note_url?: string;
  publish_time?: string;
  user_link?: string;
  user_nickname?: string;
  user_avatar?: string;
  tieba_id?: string;
  tieba_name?: string;
  tieba_link?: string;
  total_replay_num?: number;
  total_replay_page?: number;
  ip_location?: string;
  media_urls?: string[];
  cover_url?: string;
  original_media_urls?: string[];
  original_cover_url?: string;
  media_type?: string;
}

export interface TiebaComment {
  comment_id?: string;
  parent_comment_id?: string;
  content?: string;
  user_link?: string;
  user_nickname?: string;
  user_avatar?: string;
  tieba_id?: string;
  tieba_name?: string;
  tieba_link?: string;
  publish_time?: string;
  ip_location?: string;
  sub_comment_count?: number;
  note_id?: string;
  note_url?: string;
}

export interface TiebaCreator {
  user_id?: string;
  user_name?: string;
  nickname?: string;
  avatar?: string;
  ip_location?: string;
  gender?: string;
  follows?: string;
  fans?: string;
  registration_duration?: string;
}
