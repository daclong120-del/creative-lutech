/**
 * # Giao diện trừu tượng cho tầng lưu trữ dữ liệu
 * Khác ChinaMediaCrawler: chỉ lưu vào Supabase DB + Cloudflare R2, không có Excel/JSON/CSV
 */
export interface IStore {
  storeContent(contentItem: ContentItem): Promise<void>;
  storeComment(commentItem: CommentItem): Promise<void>;
  storeCreator(creatorItem: CreatorItem): Promise<void>;
}

export interface IMediaStore {
  uploadMedia(platform: string, entityId: string, filename: string, buffer: Buffer, mimeType: string): Promise<string>;
  checkMediaExists(platform: string, entityId: string, filename: string): Promise<boolean>;
}

export interface ContentItem {
  platform: string;
  platformId: string;
  authorId: string;
  caption: string;
  mediaUrls: string[];
  coverUrl?: string;
  stats: ContentStats;
  raw: any;
  publishedAt: string;
}

export interface CommentItem {
  platform: string;
  platformCid: string;
  postId?: string;
  platformPostId: string;
  parentCid?: string;
  authorUid: string;
  authorNickname: string;
  content: string;
  likeCount: number;
  raw: any;
  publishedAt?: string;
}

export interface CreatorItem {
  platform: string;
  platformUid: string;
  nickname: string;
  avatarUrl?: string;
  raw: any;
}

export interface ContentStats {
  diggCount: number;
  commentCount: number;
  shareCount: number;
  playCount: number;
}
