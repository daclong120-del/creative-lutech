/**
 * # Bộ trích xuất dữ liệu (Extractor) cho Kuaishou
 */

import type { CrawledAuthorRow, CrawledPostRow, CrawledCommentRow } from "../../model/storage.js";

export class KuaishouExtractor {
  /**
   * # Loại bỏ các thẻ HTML để lấy văn bản thuần
   */
  static stripHtmlTags(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * # Chuyển đổi timestamp mili giây của Kuaishou sang ISO 8601
   */
  static parseTimestamp(ts?: any): string {
    if (!ts) {
      return new Date().toISOString();
    }
    const timestamp = typeof ts === "string" ? parseInt(ts, 10) : Number(ts);
    if (isNaN(timestamp)) {
      return new Date().toISOString();
    }
    return new Date(timestamp).toISOString();
  }

  /**
   * # Trích xuất thông tin Author từ profile Kuaishou
   */
  static extractAuthor(rawCreator: any): CrawledAuthorRow {
    const profile = rawCreator.profile || {};
    const ownerCount = rawCreator.ownerCount || {};
    const userId = String(profile.user_id || rawCreator.user_id || "");

    const genderVal = profile.gender || rawCreator.gender || "";
    const gender = (genderVal === "F" || genderVal === "f" || genderVal === "Female") 
      ? "Female" 
      : (genderVal === "M" || genderVal === "m" || genderVal === "Male") 
        ? "Male" 
        : "Unknown";

    return {
      platform: "kuaishou",
      platform_uid: userId,
      nickname: profile.user_name || rawCreator.nickname || "",
      avatar_url: profile.headurl || rawCreator.avatar || "",
      gender,
      description: profile.user_text || rawCreator.desc || "",
      follows_count: typeof ownerCount.follow === "number" ? ownerCount.follow : (typeof rawCreator.follows === "number" ? rawCreator.follows : undefined),
      fans_count: typeof ownerCount.fan === "number" ? ownerCount.fan : (typeof rawCreator.fans === "number" ? rawCreator.fans : undefined),
      interaction_count: typeof ownerCount.photo_public === "number" ? ownerCount.photo_public : (typeof rawCreator.interaction === "number" ? rawCreator.interaction : undefined),
      raw: rawCreator,
    };
  }

  /**
   * # Trích xuất URL phát video từ thực thể photo
   */
  static extractVideoPlayUrl(photo: any): string {
    if (!photo) return "";
    if (photo.photoUrl) return photo.photoUrl;
    if (photo.photoH265Url) return photo.photoH265Url;

    if (photo.manifest) {
      try {
        const manifestObj = typeof photo.manifest === "string" ? JSON.parse(photo.manifest) : photo.manifest;
        const adaptationSet = manifestObj?.adaptationSet;
        if (Array.isArray(adaptationSet) && adaptationSet.length > 0) {
          const representation = adaptationSet[0]?.representation;
          if (Array.isArray(representation) && representation.length > 0) {
            const selected = representation.find((r: any) => r.defaultSelect) || representation[0];
            if (selected?.url) return selected.url;
            if (selected?.backupUrl) return selected.backupUrl;
          }
        }
      } catch {}
    }

    if (photo.manifestH265) {
      try {
        const manifestObj = typeof photo.manifestH265 === "string" ? JSON.parse(photo.manifestH265) : photo.manifestH265;
        const adaptationSet = manifestObj?.adaptationSet;
        if (Array.isArray(adaptationSet) && adaptationSet.length > 0) {
          const representation = adaptationSet[0]?.representation;
          if (Array.isArray(representation) && representation.length > 0) {
            const selected = representation.find((r: any) => r.defaultSelect) || representation[0];
            if (selected?.url) return selected.url;
            if (selected?.backupUrl) return selected.backupUrl;
          }
        }
      } catch {}
    }

    return "";
  }

  /**
   * # Trích xuất thông tin bài đăng (Post)
   */
  static extractPost(videoItem: any, authorUuid?: string): CrawledPostRow {
    const photo = videoItem.photo || videoItem;
    const author = videoItem.author || {};
    const platformId = String(photo.id || "");
    const rawCaption = photo.caption || photo.title || "";
    const caption = this.stripHtmlTags(rawCaption);

    const mediaUrls: string[] = [];
    const playUrl = this.extractVideoPlayUrl(photo);
    if (playUrl) {
      mediaUrls.push(playUrl);
    }

    const coverUrl = photo.coverUrl || photo.video_cover_url || "";

    const stats = {
      liked_count: Number(photo.realLikeCount || photo.likeCount || videoItem.liked_count || 0),
      comments_count: Number(photo.commentCount || videoItem.comment_count || 0),
      view_count: Number(photo.viewCount || videoItem.view_count || videoItem.viewd_count || 0),
      play_count: Number(photo.viewCount || videoItem.view_count || videoItem.viewd_count || 0),
    };

    return {
      platform: "kuaishou",
      platform_id: platformId,
      author_id: authorUuid,
      caption,
      media_urls: mediaUrls,
      cover_url: coverUrl,
      stats,
      raw: videoItem,
      published_at: this.parseTimestamp(photo.timestamp || videoItem.create_time),
    };
  }

  /**
   * # Trích xuất thông tin bình luận (Comment)
   */
  static extractComment(commentItem: any, platformPostId: string, postUuid?: string, parentCid?: string): CrawledCommentRow {
    // V2 API sử dụng snake_case, GraphQL sử dụng camelCase
    const cid = String(commentItem.comment_id || commentItem.commentId || "");
    const rawContent = commentItem.content || "";
    const content = this.stripHtmlTags(rawContent);

    // Xác định parent_cid: nếu có parentCid truyền vào thì lấy, hoặc check replyTo/replyToUserName của Kuaishou
    const replyTo = commentItem.replyTo ? String(commentItem.replyTo) : undefined;
    const resolvedParentCid = parentCid || (replyTo && replyTo !== "0" && replyTo !== cid ? replyTo : undefined);

    const authorUid = commentItem.author_id || commentItem.authorId;
    const authorNickname = commentItem.author_name || commentItem.authorName || "";

    return {
      platform: "kuaishou",
      platform_cid: cid,
      post_id: postUuid,
      platform_post_id: platformPostId,
      parent_cid: resolvedParentCid,
      author_uid: authorUid ? String(authorUid) : undefined,
      author_nickname: authorNickname,
      content,
      like_count: Number(commentItem.realLikedCount || commentItem.likedCount || commentItem.like_count || 0),
      raw: commentItem,
      published_at: this.parseTimestamp(commentItem.timestamp || commentItem.create_time),
    };
  }
}
