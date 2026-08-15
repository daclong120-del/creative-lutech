/**
 * # Type definitions cho dữ liệu API response của Kuaishou
 * Ánh xạ từ ChinaMediaCrawler models.py: KuaishouVideo, KuaishouVideoComment
 */

export interface KuaishouAuthor {
  id?: string;
  name?: string;
  headUrl?: string;
}

export interface KuaishouVideo {
  photoId?: string;
  caption?: string;
  timestamp?: number;
  author?: KuaishouAuthor;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  coverUrl?: string;
  photoUrl?: string;
  videoUrl?: string;
  photoType?: string;
}

export interface KuaishouComment {
  commentId?: number;
  photoId?: string;
  content?: string;
  timestamp?: number;
  likeCount?: number;
  subCommentCount?: number;
  replyToCommentId?: number;
  author?: {
    id?: string;
    name?: string;
    headUrl?: string;
  };
}
