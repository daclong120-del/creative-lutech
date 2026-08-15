import { DouyinAweme } from "../../model/douyin.js";
import { CrawledPostRow } from "../../model/storage.js";

/**
 * # Chuyển đổi dữ liệu bài đăng gốc Douyin sang định dạng database CrawledPostRow
 */
export function mapAwemeToPostRow(
  detail: DouyinAweme,
  authorUuid: string
): CrawledPostRow {
  let mediaType = "unknown";
  if (detail.video) {
    mediaType = "video";
  } else if (detail.images && Array.isArray(detail.images)) {
    mediaType = detail.images.length > 1 ? "carousel" : "image";
  } else {
    mediaType = "image";
  }

  const originalMediaUrls: string[] = [];
  let originalCoverUrl = "";

  if (detail.video) {
    const videoUrl = detail.video.play_addr?.url_list?.[0];
    if (videoUrl) originalMediaUrls.push(videoUrl);

    const coverUrlVal = detail.video.cover?.url_list?.[0];
    if (coverUrlVal) originalCoverUrl = coverUrlVal;
  }

  if (detail.images && Array.isArray(detail.images)) {
    for (const img of detail.images) {
      const imgUrl = img.display_image_width_goods?.url_list?.[0] || img.url_list?.[0];
      if (imgUrl) {
        originalMediaUrls.push(imgUrl);
      }
    }
    if (originalMediaUrls.length > 0 && !originalCoverUrl) {
      originalCoverUrl = originalMediaUrls[0];
    }
  }

  const mediaUrls: string[] = [...originalMediaUrls];
  let coverUrl = originalCoverUrl;

  let mediaSource = "original";
  let mediaStatus = "original_only";
  let mediaError: string | null = null;
  let mediaCachedAt: string | null = null;

  if (originalMediaUrls.length === 0 && !originalCoverUrl) {
    mediaSource = "none";
    mediaStatus = "unavailable";
  }

  const publishedAt = detail.create_time ? new Date(detail.create_time * 1000).toISOString() : new Date().toISOString();

  return {
    platform: "douyin",
    platform_id: detail.aweme_id,
    author_id: authorUuid,
    caption: detail.desc || "",
    media_urls: mediaUrls,
    cover_url: coverUrl || undefined,
    stats: {
      digg_count: detail.statistics?.digg_count ?? 0,
      comment_count: detail.statistics?.comment_count ?? 0,
      share_count: detail.statistics?.share_count ?? 0,
      play_count: detail.statistics?.play_count ?? 0,
    },
    raw: detail,
    published_at: publishedAt,
    media_type: mediaType,
    original_media_urls: originalMediaUrls,
    original_cover_url: originalCoverUrl || undefined,
    media_status: mediaStatus,
    media_source: mediaSource,
    media_error: mediaError,
    media_cached_at: mediaCachedAt || undefined,
  };
}

/**
 * # Chuyển đổi dữ liệu bình luận gốc sang định dạng database
 */
export function mapCommentRow(c: any, awemeId: string, postUuid?: string, parentCid?: string) {
  return {
    platform: "douyin",
    platform_cid: c.cid,
    post_id: postUuid,
    platform_post_id: awemeId,
    parent_cid: parentCid,
    author_uid: c.user?.sec_uid || "",
    author_nickname: c.user?.nickname || "",
    content: c.text || "",
    like_count: c.digg_count || 0,
    raw: c,
    published_at: c.create_time ? new Date(c.create_time * 1000).toISOString() : undefined,
  };
}
