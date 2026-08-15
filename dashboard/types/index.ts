/** Nền tảng mạng xã hội Trung Quốc + TikTok */
export type Platform = "douyin" | "xhs" | "bilibili" | "weibo" | "kuaishou" | "tieba" | "zhihu" | "tiktok";

/** Trạng thái task crawler */
export type TaskStatus = "scheduled" | "pending" | "running" | "completed" | "failed" | "cancelled";

/** Mức ưu tiên task */
export type TaskPriority = "critical" | "high" | "normal" | "low";

/** Loại cào */
export type CrawlCommand =
  | "crawl"
  | "creator"
  | "search"
  | "comments"
  | "comment"
  | "ads";

/** Trạng thái tài khoản */
export type AccountStatus = "active" | "banned";

/** Trạng thái proxy */
export type ProxyStatus = "active" | "inactive" | "dead";

/** Mức độ log */
export type LogLevel = "INFO" | "DEBUG" | "WARN" | "ERROR";

// ─── Entities ───────────────────────────────────────────────

export interface CrawlerTask {
  id: string;
  platform: Platform;
  command: CrawlCommand;
  target: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduled_at: string | null;
  created_at: string;
  created_by: string;
  error_message?: string | null;
  params?: Record<string, unknown>;
  metadata?: {
    tags?: string[];
    language?: string;
    crawl_comments?: boolean;
    crawl_sub_comments?: boolean;
    headless?: boolean;
    error_message?: string;
    phase?: string;
    progress?: {
      current: number;
      target: number;
    };
    comment_progress?: {
      current: number;
      target: number;
    };
  };
}

export interface CrawlerAccount {
  id: string;
  platform: Platform;
  alias: string;
  status: AccountStatus;
  failure_count: number;
  proxy: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface ProxyItem {
  id: string;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  protocol: "http" | "https" | "socks5";
  status: ProxyStatus;
  assigned_account_id: string | null;
  assigned_account_alias: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface CrawledAuthor {
  id: string;
  platform_uid: string;
  nickname: string;
  platform: Platform;
  gender: "male" | "female" | "unknown";
  description: string;
  fans_count: number;
  follows_count: number;
  ip_location: string;
  avatar_url: string;
  crawled_at: string;
}

export interface CrawledPost {
  id: string;
  platform: Platform;
  author_id: string;
  platform_uid: string;
  title: string;
  caption: string;
  cover_url: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  media_urls: string[];
  tags: string[];
  published_at: string;
  crawled_at: string;
}

export interface CrawledComment {
  id: string;
  post_id: string;
  parent_cid: string | null;
  content: string;
  like_count: number;
  created_at: string;
  author_nickname?: string | null;
  children?: CrawledComment[];
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface CrawlerLogEntry {
  id: string;
  task_id: string;
  level: LogLevel;
  message: string;
  created_at: string;
}

export interface ExportedFile {
  id: string;
  filename: string;
  type: "xlsx" | "csv";
  filter_snapshot: Record<string, unknown>;
  size_bytes: number;
  created_by: string;
  created_at: string;
  download_url: string;
}

export interface PostTag {
  id: string;
  name: string;
  color: string;
  description: string;
  usage_count: number;
  created_at: string;
}

export interface ViewerPermission {
  key: string;
  label: string;
  allowed: boolean;
  locked?: boolean;
  lockedOff?: boolean;
  note?: string;
}

/** Thông tin tổng hợp cho mỗi platform */
export interface PlatformHealth {
  platform: Platform;
  active: number;
  banned: number;
  total: number;
}

export interface CreativeAdvertiser {
  id: string;
  platform_uid: string;
  nickname: string;
  platform: Platform;
  avatar_url: string;
  description: string;
  creative_count: number;
  total_views: number;
  total_likes: number;
  follows_count: number;
  fans_count: number | null;
  crawled_at: string;
  last_active_at: string;
}

export interface CreativeAd {
  id: string;
  platform: Platform;
  author_id: string;
  platform_uid: string;
  title: string;
  caption: string;
  cover_url: string;
  media_type: "video" | "image" | "carousel" | "text" | "unknown";
  like_count: number;
  view_count: number;
  comment_count: number;
  share_count: number;
  media_urls: string[];
  tags: string[];
  published_at: string;
  crawled_at: string;
  is_ad: boolean;
  growth_rate: number;
  views_history: { date: string; count: number }[];
  historySource?: "snapshot" | "fallback";
  author?: CreativeAdvertiser | null;
  original_media_urls?: string[];
  original_cover_url?: string;
  media_status?: "original_only" | "cached" | "failed" | "expired" | "unavailable" | "not_applicable" | "unknown";
  media_source?: "original" | "r2" | "mixed" | "none";
  media_error?: string | null;
  content_type?: string;
  source_url?: string;
}

