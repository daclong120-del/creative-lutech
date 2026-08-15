export interface CrawledAuthorRow {
  platform: string;
  platform_uid: string;
  nickname?: string;
  avatar_url?: string;
  gender?: string;
  description?: string;
  follows_count?: number;
  fans_count?: number;
  interaction_count?: number;
  videos_count?: number;
  ip_location?: string;
  raw?: unknown;
}

export interface CrawledPostRow {
  platform: string;
  platform_id: string;
  author_id?: string;
  title?: string;
  caption?: string;
  media_urls?: string[];
  cover_url?: string;
  stats?: unknown;
  raw?: unknown;
  published_at?: string;
  tags?: string[];
  language?: string;
  media_type?: string;
  content_type?: string;
  source_url?: string;
  original_media_urls?: string[];
  original_cover_url?: string;
  media_status?: string;
  media_source?: string;
  media_error?: string | null;
  media_cached_at?: string;
}

export interface CrawledCommentRow {
  platform: string;
  platform_cid: string;
  post_id?: string;
  platform_post_id: string;
  parent_cid?: string;
  author_uid?: string;
  author_nickname?: string;
  content?: string;
  like_count?: number;
  raw?: unknown;
  published_at?: string;
}

/**
 * # Đại diện cho một task cào dữ liệu trong hàng đợi Supabase
 */
export interface CrawlerTask {
  id?: string;
  platform: string;
  command: string;
  target: string;
  max_count?: number;
  status: "pending" | "running" | "completed" | "failed";
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    tags?: string[];
    language?: string;
    crawl_comments?: boolean;
    crawl_sub_comments?: boolean;
    headless?: boolean;
    media_strategy?: string;
    progress?: {
      current: number;
      target: number;
    };
  };
}

/**
 * # Nhật ký hoạt động của task cào dữ liệu được stream lên DB
 */
export interface CrawlerLog {
  id?: number;
  task_id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  created_at?: string;
}

