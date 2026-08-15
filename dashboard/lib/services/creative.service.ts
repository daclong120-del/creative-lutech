/**
 * Service — Creative Hub (Ads, Advertisers, Trending, Growth)
 * Phục vụ các trang Creative > Search, Trending, New, Growth, Advertisers, Detail.
 */
import { createClientServer } from "@/lib/supabase/server";
import { PostRepository, type PostQueryOpts } from "@/lib/repositories/post.repo";
import { AuthorRepository } from "@/lib/repositories/author.repo";
import type { CreativeAd, CreativeAdvertiser, Platform } from "@/types";
import type { TableRow, DbClient } from "@/lib/repositories/types";

// ─── Mappers ─────────────────────────────────────────────────

interface PostSnapshot {
  post_id: string;
  observed_at: string;
  view_count: number;
}

type PostStats = {
  play_count?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
};

function isDynamicServerUsageError(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

async function withSupabaseTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), 1200);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getPostStats(row: TableRow<"crawled_posts">): PostStats {
  if (typeof row.stats !== "object" || row.stats === null || Array.isArray(row.stats)) {
    return {};
  }
  
  const rawStats = row.stats as Record<string, unknown>;
  let play_count = Number(rawStats.play_count ?? 0);
  if (play_count === 0) {
    play_count = Number(rawStats.view_count || rawStats.playCount || 0);
  }

  let like_count = Number(rawStats.like_count ?? 0);
  if (like_count === 0) {
    like_count = Number(
      rawStats.digg_count || 
      rawStats.liked_count || 
      rawStats.voteup_count || 
      rawStats.voteupCount || 
      0
    );
  }

  const comment_count = Number(rawStats.comment_count || rawStats.comments_count || rawStats.commentCount || 0);
  const share_count = Number(rawStats.share_count || rawStats.shared_count || rawStats.shareCount || 0);

  return {
    play_count,
    view_count: play_count,
    like_count,
    comment_count,
    share_count,
  };
}

function resolveMediaUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    const lower = value.toLowerCase();
    if (
      lower.includes("bilibili") ||
      lower.includes("bilivideo") ||
      lower.includes("snssdk") ||
      lower.includes("iesdouyin") ||
      lower.includes("kuaishou") ||
      lower.includes("xhscdn")
    ) {
      return `/api/video/proxy?url=${encodeURIComponent(value)}`;
    }
    return value;
  }
  return "";
}

function inferMediaType(row: TableRow<"crawled_posts">): CreativeAd["media_type"] {
  const explicit = row.media_type;
  if (explicit === "video" || explicit === "image" || explicit === "carousel" || explicit === "unknown") {
    return explicit as CreativeAd["media_type"];
  }

  const urls = Array.isArray(row.media_urls) ? (row.media_urls as string[]) : [];
  const firstUrl = urls[0] ?? "";

  if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(firstUrl)) return "video";
  if (urls.length > 1) return "carousel";
  if (firstUrl || row.cover_url) return "image";
  return "unknown";
}

function mapPostToCreativeAd(
  row: TableRow<"crawled_posts">,
  author?: TableRow<"crawled_authors"> | null,
  postSnapshots?: PostSnapshot[]
): CreativeAd {
  const stats = getPostStats(row);
  const views = stats.play_count || stats.view_count || 0;
  const likes = stats.like_count || 0;
  const comments = stats.comment_count || 0;
  const shares = stats.share_count || 0;

  // Lấy latest snapshot per day cho post này để tránh double-count khi UI sum các bài đăng của advertiser.
  let viewsHistory: { date: string; count: number }[] = [];
  let historySource: "snapshot" | "fallback" = "fallback";

  if (postSnapshots && postSnapshots.length > 0) {
    historySource = "snapshot";
    const dailyLatest: Record<string, PostSnapshot> = {};
    postSnapshots.forEach(s => {
      const dateStr = new Date(s.observed_at).toISOString().split("T")[0];
      if (!dailyLatest[dateStr] || new Date(s.observed_at).getTime() > new Date(dailyLatest[dateStr].observed_at).getTime()) {
        dailyLatest[dateStr] = s;
      }
    });

    viewsHistory = Object.entries(dailyLatest).map(([date, val]) => ({
      date,
      count: Number(val.view_count || 0)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    historySource = "fallback";
    viewsHistory = [
      {
        date: new Date(row.published_at || row.crawled_at || Date.now()).toISOString().split("T")[0],
        count: views
      }
    ];
  }

  const mediaUrls = Array.isArray(row.media_urls) ? (row.media_urls as string[]) : [];
  const originalMediaUrls = Array.isArray(row.original_media_urls) ? (row.original_media_urls as string[]) : mediaUrls;

  // Resolve các URL tương đối (R2) sang URL đầy đủ để UI render
  const resolvedMediaUrls = mediaUrls.map(url => resolveMediaUrl(url));
  const resolvedCoverUrl = resolveMediaUrl(row.cover_url);
  const resolvedOriginalCoverUrl = resolveMediaUrl(row.original_cover_url || row.cover_url);
  const growthRate =
    historySource === "snapshot" && viewsHistory.length >= 2
      ? Math.round(((viewsHistory.at(-1)!.count - viewsHistory[0].count) / Math.max(1, viewsHistory[0].count)) * 100)
      : 0;

  return {
    id: row.id,
    platform: row.platform as Platform,
    author_id: row.author_id || "",
    platform_uid: row.platform_id || "",
    title: row.caption?.slice(0, 30) || "",
    caption: row.caption || "",
    cover_url: resolvedCoverUrl,
    media_type: inferMediaType(row),
    like_count: likes,
    view_count: views,
    comment_count: comments,
    share_count: shares,
    media_urls: resolvedMediaUrls,
    tags: (row.tags as string[]) || [],
    published_at: row.published_at || row.crawled_at || "",
    crawled_at: row.crawled_at || "",
    is_ad: true,
    growth_rate: Math.min(999, Math.max(0, growthRate)),
    views_history: viewsHistory,
    historySource,
    author: author ? mapAuthorToAdvertiser(author, 0, 0, 0) : null,
    original_media_urls: originalMediaUrls,
    original_cover_url: resolvedOriginalCoverUrl,
    media_status: (row.media_status as CreativeAd["media_status"]) || "unknown",
    media_source: (row.media_source as CreativeAd["media_source"]) || "original",
    media_error: row.media_error || null,
  };
}

function mapAuthorToAdvertiser(
  author: TableRow<"crawled_authors">,
  postCount: number,
  totalViews: number,
  totalLikes: number,
): CreativeAdvertiser {
  return {
    id: author.id,
    platform_uid: author.platform_uid || "",
    nickname: author.nickname || "Unknown",
    platform: author.platform as Platform,
    avatar_url: author.avatar_url || "",
    description: author.description || "",
    creative_count: postCount,
    total_views: totalViews,
    total_likes: totalLikes,
    follows_count: author.follows_count || 0,
    fans_count: author.fans_count !== null && author.fans_count !== undefined ? author.fans_count : null,
    crawled_at: author.updated_at || author.created_at || "",
    last_active_at: author.updated_at || "",
  };
}

// ─── Service Functions ───────────────────────────────────────

/** Tìm kiếm creative ads (bài viết) với bộ lọc đầy đủ */
export async function searchAds(opts: PostQueryOpts & { page?: number } = {}): Promise<{
  data: CreativeAd[];
  page: number;
  limit: number;
  total: number;
}> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const offset = (page - 1) * limit;
  try {
    const db = await createClientServer();
    const postRepo = new PostRepository(db as unknown as DbClient);
    const authorRepo = new AuthorRepository(db as unknown as DbClient);

  const { data: posts, count } = await withSupabaseTimeout(postRepo.findMany({
    ...opts,
    limit,
    offset,
  }), "searchAds.findMany");

  if (posts.length === 0) {
    return { data: [], page, limit, total: count };
  }

  // Lấy thông tin tác giả tương ứng
    const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))] as string[];
    const authors = authorIds.length > 0
      ? await withSupabaseTimeout(authorRepo.findByIds(authorIds), "searchAds.findByIds")
      : [];
  const authorsMap = new Map<string, TableRow<"crawled_authors">>(
    authors.map((a) => [a.id, a])
  );

  const data = posts.map((post) => {
    const author = post.author_id ? authorsMap.get(post.author_id) : null;
    return mapPostToCreativeAd(post, author);
  });

    return { data, page, limit, total: count };
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[CreativeService] searchAds failed; returning empty result:", err);
    return { data: [], page, limit, total: 0 };
  }
}

/** Lấy chi tiết 1 creative ad */
export async function getAdById(id: string): Promise<CreativeAd | null> {
  try {
    const db = await createClientServer();
    const postRepo = new PostRepository(db as unknown as DbClient);
    const authorRepo = new AuthorRepository(db as unknown as DbClient);

  const row = await withSupabaseTimeout(postRepo.findById(id), "getAdById.findById");
  if (!row) return null;

  let author = null;
  if (row.author_id) {
    author = await withSupabaseTimeout(authorRepo.findById(row.author_id), "getAdById.findAuthor");
  }

    return mapPostToCreativeAd(row, author);
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[CreativeService] getAdById failed; returning null:", err);
    return null;
  }
}

/** Lấy danh sách advertisers (tác giả + thống kê bài viết) */
export async function getAdvertisers(opts: {
  platform?: string;
  platforms?: string[];
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: CreativeAdvertiser[]; total: number }> {
  try {
    const db = await createClientServer();
    const authorRepo = new AuthorRepository(db as unknown as DbClient);
    const postRepo = new PostRepository(db as unknown as DbClient);
    const platforms =
      opts.platforms ??
      opts.platform
        ?.split(",")
        .map((platform) => platform.trim())
        .filter((platform) => platform && platform !== "all");

    const { data: authors, count } = await withSupabaseTimeout(authorRepo.findMany({
      platform: platforms && platforms.length === 1 ? platforms[0] : opts.platform,
      platforms: platforms && platforms.length > 1 ? platforms : undefined,
      search: opts.search,
      limit: opts.limit ?? 100,
      offset: opts.offset,
    }), "getAdvertisers.findMany");

    // Tính thống kê bài viết cho mỗi tác giả
    const advertiserPromises = authors.map(async (author) => {
      const { data: posts } = await withSupabaseTimeout(
        postRepo.findByAuthorId(author.id, 1000),
        "getAdvertisers.findByAuthorId"
      );
      let totalViews = 0;
      let totalLikes = 0;
      posts.forEach((p) => {
        const stats = getPostStats(p);
        totalViews += stats.play_count || stats.view_count || 0;
        totalLikes += stats.like_count || 0;
      });
      return mapAuthorToAdvertiser(author, posts.length, totalViews, totalLikes);
    });

    const data = await Promise.all(advertiserPromises);
    return { data, total: count };
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.warn("[CreativeService] getAdvertisers failed; returning empty result:", err);
    return { data: [], total: 0 };
  }
}

/** Lấy chi tiết 1 advertiser + danh sách bài viết của họ */
export async function getAdvertiserById(id: string): Promise<{
  advertiser: CreativeAdvertiser | null;
  ads: CreativeAd[];
} | null> {
  try {
    const db = await createClientServer();
    const authorRepo = new AuthorRepository(db as unknown as DbClient);
    const postRepo = new PostRepository(db as unknown as DbClient);

    const author = await withSupabaseTimeout(authorRepo.findById(id), "getAdvertiserById.findById");
    if (!author) return null;
    const { data: posts } = await withSupabaseTimeout(
      postRepo.findByAuthorId(id, 100),
      "getAdvertiserById.findByAuthorId"
    );

    let totalViews = 0;
    let totalLikes = 0;
    posts.forEach((p) => {
      const stats = getPostStats(p);
      totalViews += stats.play_count || stats.view_count || 0;
      totalLikes += stats.like_count || 0;
    });

    // Lấy snapshots lịch sử cho các posts này
    let snapshots: PostSnapshot[] = [];
    if (posts && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const { data: snaps, error: snapErr } = await db
        .from("post_metric_snapshots")
        .select("post_id, observed_at, view_count")
        .in("post_id", postIds)
        .order("observed_at", { ascending: true });
        
      if (!snapErr && snaps) {
        snapshots = snaps as PostSnapshot[];
      }
    }

    const advertiser = mapAuthorToAdvertiser(author, posts.length, totalViews, totalLikes);
    
    // Gom nhóm snapshots theo post_id
    const snapshotsByPost: Record<string, PostSnapshot[]> = {};
    if (snapshots && snapshots.length > 0) {
      snapshots.forEach(s => {
        if (!snapshotsByPost[s.post_id]) {
          snapshotsByPost[s.post_id] = [];
        }
        snapshotsByPost[s.post_id].push(s);
      });
    }

    const ads = posts.map((p) => {
      const postSnaps = snapshotsByPost[p.id] || [];
      return mapPostToCreativeAd(p, author, postSnaps);
    });

    return { advertiser, ads };
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    return null;
  }
}

/** Lấy bài viết trending (sắp xếp theo lượt xem) */
export async function getTrending(limit = 20): Promise<CreativeAd[]> {
  const result = await searchAds({ sort: "views", limit });
  return result.data;
}

/** Lấy bài viết mới nhất */
export async function getNew(limit = 20): Promise<CreativeAd[]> {
  const result = await searchAds({ sort: "newest", limit });
  return result.data;
}

/** Lấy bài viết tăng trưởng nhanh — TODO: cần bảng lịch sử views để tính growth thật */
export async function getGrowth(limit = 20): Promise<CreativeAd[]> {
  const result = await searchAds({ sort: "views", limit });
  return result.data;
}

/** Lấy bài viết tương tự (cùng platform, loại trừ bài hiện tại) */
export async function getSimilar(platform: string, currentAdId: string, limit = 8): Promise<CreativeAd[]> {
  const result = await searchAds({ platform, limit: limit + 1 });
  return result.data.filter((ad) => ad.id !== currentAdId).slice(0, limit);
}
