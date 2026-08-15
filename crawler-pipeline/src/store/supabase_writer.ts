import { supabaseRest } from "./supabase_client.js";
import { CrawledAuthorRow, CrawledPostRow, CrawledCommentRow } from "../model/storage.js";

/**
 * # Thêm mới hoặc cập nhật thông tin tác giả và trả về UUID tương ứng
 */
export async function upsertAuthor(author: CrawledAuthorRow): Promise<string> {
  const authorId = `${author.platform}_${author.platform_uid}`;
  const result = await supabaseRest("crawled_authors", {
    method: "POST",
    params: { on_conflict: "platform,platform_uid" },
    body: {
      id: authorId,
      platform: author.platform,
      platform_uid: author.platform_uid,
      nickname: author.nickname,
      avatar_url: author.avatar_url,
      gender: author.gender,
      description: author.description,
      follows_count: author.follows_count,
      fans_count: author.fans_count,
      interaction_count: author.interaction_count,
      videos_count: author.videos_count,
      ip_location: author.ip_location,
      raw: author.raw,
      updated_at: new Date().toISOString(),
    },
  });

  if (!result || result.length === 0) {
    throw new Error("Không thể lưu thông tin tác giả vào Supabase");
  }

  const savedAuthor = result[0];

  if (hasAuthorMetricInput(author)) {
    await insertAuthorMetricSnapshot({
      author_id: savedAuthor.id,
      platform: savedAuthor.platform,
      platform_author_id: savedAuthor.platform_uid,
      fans_count: Number(author.fans_count ?? 0),
      follows_count: Number(author.follows_count ?? 0),
      interaction_count: Number(author.interaction_count ?? 0),
      videos_count: Number(author.videos_count ?? 0),
      raw: author.raw || null,
      source: "crawl",
    }).catch(err => console.error("Error inserting author snapshot:", err));
  }

  return savedAuthor.id;
}

function normalizeStats(stats: any): any {
  if (typeof stats !== "object" || stats === null || Array.isArray(stats)) {
    return stats;
  }
  const normalized = { ...stats };
  
  // Normalize likes
  const likes = stats.like_count || stats.digg_count || stats.liked_count || stats.voteup_count || stats.voteupCount || 0;
  normalized.like_count = likes;
  normalized.digg_count = likes;
  normalized.liked_count = likes;
  
  // Normalize views
  const views = stats.play_count || stats.view_count || stats.playCount || 0;
  normalized.play_count = views;
  normalized.view_count = views;
  
  // Normalize comments
  const comments = stats.comment_count || stats.comments_count || stats.commentCount || 0;
  normalized.comment_count = comments;
  normalized.comments_count = comments;
  
  // Normalize shares
  const shares = stats.share_count || stats.shared_count || stats.shareCount || 0;
  normalized.share_count = shares;
  normalized.shared_count = shares;
  
  return normalized;
}

function hasPostMetricInput(stats: unknown): boolean {
  if (typeof stats !== "object" || stats === null || Array.isArray(stats)) {
    return false;
  }

  const raw = stats as Record<string, unknown>;
  const metricKeys = [
    "play_count",
    "view_count",
    "playCount",
    "like_count",
    "digg_count",
    "liked_count",
    "voteup_count",
    "voteupCount",
    "comment_count",
    "comments_count",
    "commentCount",
    "share_count",
    "shared_count",
    "shareCount",
  ];

  return metricKeys.some((key) => raw[key] !== undefined && raw[key] !== null);
}

function hasAuthorMetricInput(author: CrawledAuthorRow): boolean {
  return (
    author.fans_count !== undefined ||
    author.follows_count !== undefined ||
    author.interaction_count !== undefined ||
    author.videos_count !== undefined
  );
}

function hasRecognizedMetric(stats: any): boolean {
  if (!stats || typeof stats !== "object") return false;
  const keys = [
    "play_count",
    "view_count",
    "like_count",
    "digg_count",
    "comment_count",
    "share_count",
    "liked_count",
    "voteup_count"
  ];
  return keys.some(k => stats[k] !== undefined && stats[k] !== null && Number(stats[k]) > 0);
}

/**
 * # Thêm mới hoặc cập nhật thông tin bài đăng/video
 */
export async function upsertPost(post: CrawledPostRow): Promise<void> {
  const taskTagsStr = process.env.CURRENT_TASK_TAGS;
  const taskTags: string[] = taskTagsStr ? JSON.parse(taskTagsStr) : [];
  const mergedTags = Array.from(new Set([...(post.tags || []), ...taskTags]));

  const taskLang = process.env.CURRENT_TASK_LANGUAGE;
  const mergedLang = post.language && post.language !== "auto" ? post.language : (taskLang || "auto");

  const normalized = normalizeStats(post.stats) || {};
  const postId = `${post.platform}_${post.platform_id}`;

  await supabaseRest("crawled_posts", {
    method: "POST",
    params: { on_conflict: "platform,platform_id" },
    body: {
      id: postId,
      platform: post.platform,
      platform_id: post.platform_id,
      author_id: post.author_id,
      title: post.title || null,
      caption: post.caption,
      media_urls: post.media_urls || [],
      cover_url: post.cover_url,
      stats: normalized,
      raw: post.raw,
      crawled_at: new Date().toISOString(),
      published_at: post.published_at,
      tags: mergedTags,
      language: mergedLang,
      media_type: post.media_type || "unknown",
      content_type: post.content_type || "unknown",
      source_url: post.source_url || null,
      original_media_urls: post.original_media_urls || post.media_urls || [],
      original_cover_url: originalCoverUrlHelper(post),
      media_status: post.media_status || "original_only",
      media_source: post.media_source || "original",
      media_error: post.media_error || null,
      media_cached_at: post.media_cached_at || null,
    },
  });

  if (hasPostMetricInput(post.stats)) {
    await insertPostMetricSnapshot({
      post_id: postId,
      platform: post.platform,
      platform_post_id: post.platform_id,
      view_count: normalized.play_count || 0,
      like_count: normalized.like_count || 0,
      comment_count: normalized.comment_count || 0,
      share_count: normalized.share_count || 0,
      raw: post.stats || null,
      source: "crawl",
    }).catch(err => console.error("Error inserting post snapshot:", err));
  }
}

function originalCoverUrlHelper(post: CrawledPostRow): string | null {
  return post.original_cover_url || post.cover_url || null;
}

/**
 * # Thêm mới hoặc cập nhật danh sách bài đăng/video (Bulk-Upsert)
 */
export async function upsertPosts(posts: CrawledPostRow[]): Promise<void> {
  if (posts.length === 0) {
    return;
  }
  const taskTagsStr = process.env.CURRENT_TASK_TAGS;
  const taskTags: string[] = taskTagsStr ? JSON.parse(taskTagsStr) : [];
  const taskLang = process.env.CURRENT_TASK_LANGUAGE;

  const normalizedPosts = posts.map((post) => {
    const mergedTags = Array.from(new Set([...(post.tags || []), ...taskTags]));
    const mergedLang = post.language && post.language !== "auto" ? post.language : (taskLang || "auto");
    const normalized = normalizeStats(post.stats) || {};
    return {
      post: {
        id: `${post.platform}_${post.platform_id}`,
        platform: post.platform,
        platform_id: post.platform_id,
        author_id: post.author_id || null,
        title: post.title || null,
        caption: post.caption || null,
        media_urls: post.media_urls || [],
        cover_url: post.cover_url || null,
        stats: normalized,
        raw: post.raw || null,
        crawled_at: new Date().toISOString(),
        published_at: post.published_at || null,
        tags: mergedTags,
        language: mergedLang,
        media_type: post.media_type || "unknown",
        content_type: post.content_type || "unknown",
        source_url: post.source_url || null,
        original_media_urls: post.original_media_urls || post.media_urls || [],
        original_cover_url: post.original_cover_url || post.cover_url || null,
        media_status: post.media_status || "original_only",
        media_source: post.media_source || "original",
        media_error: post.media_error || null,
        media_cached_at: post.media_cached_at || null,
      },
      normalized,
      originalStats: post.stats,
    };
  });

  await supabaseRest("crawled_posts", {
    method: "POST",
    params: { on_conflict: "platform,platform_id" },
    body: normalizedPosts.map(np => np.post),
  });

  // Append bulk snapshots
  const snapshots = normalizedPosts
    .filter(np => hasPostMetricInput(np.originalStats))
    .map(np => ({
      post_id: np.post.id,
      platform: np.post.platform,
      platform_post_id: np.post.platform_id,
      view_count: np.normalized.play_count || 0,
      like_count: np.normalized.like_count || 0,
      comment_count: np.normalized.comment_count || 0,
      share_count: np.normalized.share_count || 0,
      raw: np.originalStats || null,
      source: "crawl",
    }));

  if (snapshots.length > 0) {
    await supabaseRest("post_metric_snapshots", {
      method: "POST",
      body: snapshots,
    }).catch(err => console.error("Error inserting bulk post snapshots:", err));
  }
}

/**
 * # Lấy id (UUID) của post từ bảng crawled_posts bằng platform và platform_id
 */
export async function getPostUuid(platform: string, platformId: string): Promise<string | undefined> {
  const result = await supabaseRest("crawled_posts", {
    params: {
      platform: `eq.${platform}`,
      platform_id: `eq.${platformId}`,
      select: "id",
    },
  });
  return result?.[0]?.id;
}

/**
 * # Thêm mới hoặc cập nhật danh sách bình luận cào được
 */
export async function upsertComments(comments: CrawledCommentRow[]): Promise<void> {
  if (comments.length === 0) {
    return;
  }
  await supabaseRest("crawled_comments", {
    method: "POST",
    params: { on_conflict: "platform,platform_cid" },
    body: comments.map((c) => ({
      platform: c.platform,
      platform_cid: c.platform_cid,
      post_id: c.post_id,
      platform_post_id: c.platform_post_id,
      parent_cid: c.parent_cid,
      author_uid: c.author_uid,
      author_nickname: c.author_nickname,
      content: c.content,
      like_count: c.like_count || 0,
      raw: c.raw,
      published_at: c.published_at,
      crawled_at: new Date().toISOString(),
    })),
  });
}

/**
 * # Kiểm tra xem task đã bị huỷ ngoài UI hay chưa
 */
export async function isTaskCancelled(taskId: string | null | undefined): Promise<boolean> {
  if (!taskId) return false;
  try {
    const res = await supabaseRest("crawler_tasks", {
      method: "GET",
      params: {
        id: `eq.${taskId}`,
        select: "status"
      }
    });
    if (Array.isArray(res) && res[0]) {
      return res[0].status === "cancelled";
    }
  } catch (err) {
    console.error(`Lỗi khi check trạng thái huỷ của task: ${(err as Error).message}`);
  }
  return false;
}

/**
 * # Cập nhật tiến độ của task hiện tại vào metadata
 */
export async function updateTaskProgress(taskId: string | null | undefined, current: number, target: number): Promise<void> {
  if (!taskId) return;
  try {
    const res = await supabaseRest("crawler_tasks", {
      method: "GET",
      params: {
        id: `eq.${taskId}`,
        select: "metadata"
      }
    });
    if (Array.isArray(res) && res[0]) {
      const metadata = res[0].metadata || {};
      metadata.progress = { current, target };
      await supabaseRest("crawler_tasks", {
        method: "PATCH",
        params: { id: `eq.${taskId}` },
        body: {
          metadata,
          updated_at: new Date().toISOString(),
        }
      });
    }
  } catch (err) {
    console.error(`Lỗi khi cập nhật tiến độ task: ${(err as Error).message}`);
  }
}

/**
 * # Cập nhật phase hiện tại của task vào metadata
 */
export async function updateTaskPhase(taskId: string | null | undefined, phase: string): Promise<void> {
  if (!taskId) return;
  try {
    const res = await supabaseRest("crawler_tasks", {
      method: "GET",
      params: {
        id: `eq.${taskId}`,
        select: "metadata"
      }
    });
    if (Array.isArray(res) && res[0]) {
      const metadata = res[0].metadata || {};
      metadata.phase = phase;
      await supabaseRest("crawler_tasks", {
        method: "PATCH",
        params: { id: `eq.${taskId}` },
        body: {
          metadata,
          updated_at: new Date().toISOString(),
        }
      });
    }
  } catch (err) {
    console.error(`Lỗi khi cập nhật phase của task: ${(err as Error).message}`);
  }
}

/**
 * # Cập nhật metadata chung của task (hỗ trợ patch một phần)
 */
export async function updateTaskMetadata(taskId: string | null | undefined, patch: Record<string, any>): Promise<void> {
  if (!taskId) return;
  try {
    const res = await supabaseRest("crawler_tasks", {
      method: "GET",
      params: {
        id: `eq.${taskId}`,
        select: "metadata"
      }
    });
    if (Array.isArray(res) && res[0]) {
      const metadata = { ...(res[0].metadata || {}), ...patch };
      await supabaseRest("crawler_tasks", {
        method: "PATCH",
        params: { id: `eq.${taskId}` },
        body: {
          metadata,
          updated_at: new Date().toISOString(),
        }
      });
    }
  } catch (err) {
    console.error(`Lỗi khi cập nhật metadata của task: ${(err as Error).message}`);
  }
}

/**
 * # Cập nhật tiến độ cào bình luận của task vào metadata
 */
export async function updateTaskCommentProgress(taskId: string | null | undefined, current: number, target: number): Promise<void> {
  if (!taskId) return;
  try {
    const res = await supabaseRest("crawler_tasks", {
      method: "GET",
      params: {
        id: `eq.${taskId}`,
        select: "metadata"
      }
    });
    if (Array.isArray(res) && res[0]) {
      const metadata = res[0].metadata || {};
      metadata.comment_progress = { current, target };
      await supabaseRest("crawler_tasks", {
        method: "PATCH",
        params: { id: `eq.${taskId}` },
        body: {
          metadata,
          updated_at: new Date().toISOString(),
        }
      });
    }
  } catch (err) {
    console.error(`Lỗi khi cập nhật tiến độ bình luận task: ${(err as Error).message}`);
  }
}

/**
 * # Thêm snapshot lịch sử metric của bài viết
 */
export async function insertPostMetricSnapshot(snapshot: {
  post_id: string;
  platform: string;
  platform_post_id: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  raw?: any;
  source: string;
}): Promise<void> {
  await supabaseRest("post_metric_snapshots", {
    method: "POST",
    body: {
      post_id: snapshot.post_id,
      platform: snapshot.platform,
      platform_post_id: snapshot.platform_post_id,
      view_count: snapshot.view_count,
      like_count: snapshot.like_count,
      comment_count: snapshot.comment_count,
      share_count: snapshot.share_count,
      raw: snapshot.raw || null,
      source: snapshot.source,
      observed_at: new Date().toISOString()
    }
  });
}

/**
 * # Thêm snapshot lịch sử metric của tác giả
 */
export async function insertAuthorMetricSnapshot(snapshot: {
  author_id: string;
  platform: string;
  platform_author_id: string;
  fans_count: number;
  follows_count: number;
  interaction_count: number;
  videos_count: number;
  raw?: any;
  source: string;
}): Promise<void> {
  await supabaseRest("author_metric_snapshots", {
    method: "POST",
    body: {
      author_id: snapshot.author_id,
      platform: snapshot.platform,
      platform_author_id: snapshot.platform_author_id,
      fans_count: snapshot.fans_count,
      follows_count: snapshot.follows_count,
      interaction_count: snapshot.interaction_count,
      videos_count: snapshot.videos_count,
      raw: snapshot.raw || null,
      source: snapshot.source,
      observed_at: new Date().toISOString()
    }
  });
}
