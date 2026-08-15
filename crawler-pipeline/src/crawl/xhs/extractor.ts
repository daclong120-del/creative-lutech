/**
 * # Bộ trích xuất dữ liệu (Extractor) cho Xiaohongshu (XHS)
 */

import type { CrawledAuthorRow, CrawledPostRow, CrawledCommentRow } from "../../model/storage.js";

export class XhsExtractor {
  /**
   * # Loại bỏ các thẻ HTML để lấy văn bản thuần
   */
  static stripHtmlTags(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * # Chuyển đổi timestamp của XHS sang ISO 8601
   */
  static parseTimestamp(ts?: any): string {
    if (!ts) {
      return new Date().toISOString();
    }
    const timestamp = typeof ts === "string" ? parseInt(ts, 10) : Number(ts);
    if (isNaN(timestamp)) {
      return new Date().toISOString();
    }
    // XHS timestamp có thể ở dạng giây (10 chữ số) hoặc mili giây (13 chữ số)
    const ms = timestamp < 20000000000 ? timestamp * 1000 : timestamp;
    return new Date(ms).toISOString();
  }

  /**
   * # Trích xuất thông tin Author từ raw creator
   */
  static extractAuthor(rawCreator: any): CrawledAuthorRow {
    const basicInfo = rawCreator.basicInfo || {};
    const userId = String(rawCreator.user_id || basicInfo.user_id || rawCreator.id || "");

    const followsObj = rawCreator.interactions?.find((i: any) => i.type === "follows");
    const fansObj = rawCreator.interactions?.find((i: any) => i.type === "fans");
    const interactObj = rawCreator.interactions?.find((i: any) => i.type === "interaction");

    const follows_count = followsObj ? Number(followsObj.count) : (typeof rawCreator.follows === "number" ? rawCreator.follows : undefined);
    const fans_count = fansObj ? Number(fansObj.count) : (typeof rawCreator.fans === "number" ? rawCreator.fans : undefined);
    const interaction_count = interactObj ? Number(interactObj.count) : (typeof rawCreator.interaction === "number" ? rawCreator.interaction : undefined);

    const genderVal = basicInfo.gender !== undefined ? basicInfo.gender : rawCreator.gender;
    const gender = genderVal === 0 ? "Male" : genderVal === 1 ? "Female" : "Unknown";

    const nickname = basicInfo.nickname || rawCreator.nickname || "";
    // images có thể là URL ảnh đại diện trực tiếp hoặc chuỗi URL
    const avatar_url = basicInfo.images || rawCreator.avatar || rawCreator.image || "";
    const description = basicInfo.desc || rawCreator.desc || "";
    const ip_location = basicInfo.ipLocation || rawCreator.ip_location || "";

    return {
      platform: "xhs",
      platform_uid: userId,
      nickname,
      avatar_url,
      gender,
      description,
      follows_count,
      fans_count,
      interaction_count,
      ip_location,
      raw: rawCreator,
    };
  }

  /**
   * # Trích xuất URL phát video từ thực thể note
   */
  static extractVideoPlayUrl(rawNote: any): string | null {
    if (rawNote.type !== "video" && rawNote.note_type !== "video" && rawNote.noteType !== "video") {
      return null;
    }
    const videoDict = rawNote.video || {};
    const consumer = videoDict.consumer || {};
    const originVideoKey = consumer.origin_video_key || consumer.originVideoKey || "";
    if (!originVideoKey) {
      const media = videoDict.media || {};
      const stream = media.stream || {};
      const videos = stream.h264 || stream.h265 || [];
      if (Array.isArray(videos) && videos.length > 0) {
        return videos[0].master_url || videos[0].masterUrl || null;
      }
    } else {
      return `http://sns-video-bd.xhscdn.com/${originVideoKey}`;
    }
    return null;
  }

  /**
   * # Trích xuất thông tin bài đăng (Post/Note)
   */
  static extractPost(rawNote: any, authorUuid?: string): CrawledPostRow {
    const noteId = String(rawNote.note_id || rawNote.id || "");
    const caption = this.stripHtmlTags(rawNote.desc || rawNote.title || "");

    const mediaUrls: string[] = [];
    const videoUrl = this.extractVideoPlayUrl(rawNote);
    if (videoUrl) {
      mediaUrls.push(videoUrl);
    } else {
      const imageList = rawNote.image_list || rawNote.imageList || [];
      for (const img of imageList) {
        const url = img.url_default || img.urlDefault || img.url || "";
        if (url) {
          mediaUrls.push(url);
        }
      }
    }

    const coverObj = rawNote.cover || {};
    const coverUrl = coverObj.url_default || coverObj.urlDefault || coverObj.url || rawNote.coverUrl || (mediaUrls.length > 0 ? mediaUrls[0] : "");

    const interactInfo = rawNote.interact_info || rawNote.interactInfo || {};
    const stats = {
      liked_count: Number(interactInfo.liked_count || interactInfo.likedCount || rawNote.liked_count || 0),
      collected_count: Number(interactInfo.collected_count || interactInfo.collectedCount || rawNote.collected_count || 0),
      comments_count: Number(interactInfo.comment_count || interactInfo.commentCount || rawNote.comment_count || 0),
      share_count: Number(interactInfo.share_count || interactInfo.shareCount || rawNote.share_count || 0),
    };

    return {
      platform: "xhs",
      platform_id: noteId,
      author_id: authorUuid,
      caption,
      media_urls: mediaUrls,
      cover_url: coverUrl,
      stats,
      raw: rawNote,
      published_at: this.parseTimestamp(rawNote.time || rawNote.create_time || rawNote.last_update_time),
    };
  }

  /**
   * # Trích xuất thông tin bình luận (Comment)
   */
  static extractComment(commentItem: any, platformPostId: string, postUuid?: string, parentCid?: string): CrawledCommentRow {
    const cid = String(commentItem.id || commentItem.comment_id || commentItem.commentId || "");
    const content = this.stripHtmlTags(commentItem.content || "");
    const userInfo = commentItem.user_info || commentItem.userInfo || {};
    const authorUid = String(userInfo.user_id || userInfo.userId || "");
    const authorNickname = userInfo.nickname || "";
    const likeCount = Number(commentItem.like_count || commentItem.likeCount || 0);
    const published_at = this.parseTimestamp(commentItem.create_time || commentItem.createTime);

    const targetComment = commentItem.target_comment || commentItem.targetComment || {};
    const resolvedParentCid = parentCid || (targetComment.id ? String(targetComment.id) : undefined);

    return {
      platform: "xhs",
      platform_cid: cid,
      post_id: postUuid,
      platform_post_id: platformPostId,
      parent_cid: resolvedParentCid,
      author_uid: authorUid || undefined,
      author_nickname: authorNickname,
      content,
      like_count: likeCount,
      raw: commentItem,
      published_at,
    };
  }

  /**
   * # Trích xuất chi tiết note từ trang HTML explore của XHS
   */
  static extractNoteDetailFromHtml(noteId: string, html: string): any {
    if (!html.includes("noteDetailMap") && !html.includes("note_detail_map")) {
      return null;
    }
    const match = html.match(/window\.__INITIAL_STATE__=({.*?})<\/script>/) ||
                  html.match(/window\.__INITIAL_STATE__=({.*?})/);
    if (!match) {
      return null;
    }
    try {
      const stateStr = match[1].replace(/:undefined/g, ":null");
      const state = JSON.parse(stateStr);
      const noteData = state.note || {};
      const noteDetailMap = noteData.noteDetailMap || noteData.note_detail_map || {};
      const noteCard = noteDetailMap[noteId] || {};
      return noteCard.note || null;
    } catch (e) {
      console.error("[XhsExtractor.extractNoteDetailFromHtml] Error parsing HTML state:", e);
      return null;
    }
  }

  /**
   * # Trích xuất thông tin creator từ trang HTML profile của XHS
   */
  static extractCreatorInfoFromHtml(html: string): any {
    const match = html.match(/<script>window\.__INITIAL_STATE__=(.+?)<\/script>/) ||
                  html.match(/window\.__INITIAL_STATE__=(.+?)(?:<\/script>|$)/);
    if (!match) {
      return null;
    }
    try {
      const stateStr = match[1].replace(/:undefined/g, ":null");
      const info = JSON.parse(stateStr);
      const user = info.user || {};
      return user.userPageData || user.user_page_data || null;
    } catch (e) {
      console.error("[XhsExtractor.extractCreatorInfoFromHtml] Error parsing HTML state:", e);
      return null;
    }
  }
}

