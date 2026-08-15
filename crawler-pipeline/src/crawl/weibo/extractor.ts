/**
 * # Bộ trích xuất dữ liệu (Extractor) cho Weibo
 */

import type { CrawledAuthorRow, CrawledPostRow, CrawledCommentRow } from "../../model/storage.js";
import type { WeiboAuthor, WeiboNote, WeiboComment, WeiboCreator } from "../../model/weibo.js";

export class WeiboExtractor {
  /**
   * # Loại bỏ các thẻ HTML để lấy văn bản thuần
   */
  static stripHtmlTags(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * # Chuyển đổi định dạng ngày RFC2822 của Weibo sang ISO 8601
   * Ví dụ: "Sat Dec 23 17:12:54 +0800 2023" -> ISO 8601
   */
  static parseWeiboDate(dateStr?: string): string {
    if (!dateStr) {
      return new Date().toISOString();
    }
    const timestamp = Date.parse(dateStr);
    if (isNaN(timestamp)) {
      return new Date().toISOString();
    }
    return new Date(timestamp).toISOString();
  }

  /**
   * # Trích xuất thông tin Author từ WeiboNote user info hoặc WeiboCreator
   */
  static extractAuthor(rawUser: any): CrawledAuthorRow {
    const uid = String(rawUser.id || "");
    const genderVal = rawUser.gender;
    const gender = genderVal === "f" ? "Female" : genderVal === "m" ? "Male" : "Unknown";

    return {
      platform: "weibo",
      platform_uid: uid,
      nickname: rawUser.screen_name || "",
      avatar_url: rawUser.avatar_hd || rawUser.profile_image_url || "",
      gender,
      description: rawUser.description || "",
      follows_count: typeof rawUser.follow_count === "number" ? rawUser.follow_count : undefined,
      fans_count: typeof rawUser.followers_count === "number" ? rawUser.followers_count : undefined,
      ip_location: (rawUser.source || rawUser.ip_location || "").replace(/^来自/, "").replace(/^发布于 /, "").trim(),
      raw: rawUser,
    };
  }

  /**
   * # Trích xuất thông tin bài đăng (Post)
   */
  static extractPost(noteItem: any, authorId?: string): CrawledPostRow {
    const mblog = noteItem.mblog || noteItem;
    const platformId = String(mblog.id || "");
    const rawCaption = mblog.text || mblog.text_raw || "";
    const caption = this.stripHtmlTags(rawCaption);

    // Thu thập danh sách ảnh
    const mediaUrls: string[] = [];
    if (mblog.pics && Array.isArray(mblog.pics)) {
      for (const pic of mblog.pics) {
        if (typeof pic === "string") {
          mediaUrls.push(pic);
        } else if (pic && pic.url) {
          mediaUrls.push(pic.url);
        }
      }
    }

    // Kiểm tra và lấy luồng video nếu có
    const streamUrl = mblog.page_info?.media_info?.stream_url || mblog.page_info?.media_info?.mp4_sd_url;
    if (streamUrl) {
      mediaUrls.push(streamUrl);
    }

    const coverUrl = mblog.page_info?.page_pic?.url || (mediaUrls.length > 0 ? mediaUrls[0] : "");

    const stats = {
      liked_count: mblog.attitudes_count || 0,
      comments_count: mblog.comments_count || 0,
      shared_count: mblog.reposts_count || 0,
    };

    return {
      platform: "weibo",
      platform_id: platformId,
      author_id: authorId,
      caption,
      media_urls: mediaUrls,
      cover_url: coverUrl,
      stats,
      raw: noteItem,
      published_at: this.parseWeiboDate(mblog.created_at),
    };
  }

  /**
   * # Trích xuất thông tin bình luận (Comment)
   */
  static extractComment(commentItem: any, platformPostId: string, postId?: string): CrawledCommentRow {
    const cid = String(commentItem.id || "");
    const rawContent = commentItem.text || "";
    const content = this.stripHtmlTags(rawContent);
    const parentCid = commentItem.rootid ? String(commentItem.rootid) : undefined;
    const author = commentItem.user || {};

    return {
      platform: "weibo",
      platform_cid: cid,
      post_id: postId,
      platform_post_id: platformPostId,
      parent_cid: parentCid && parentCid !== "0" && parentCid !== cid ? parentCid : undefined,
      author_uid: author.id ? String(author.id) : undefined,
      author_nickname: author.screen_name || "",
      content,
      like_count: commentItem.like_count || 0,
      raw: commentItem,
      published_at: this.parseWeiboDate(commentItem.created_at),
    };
  }
}
