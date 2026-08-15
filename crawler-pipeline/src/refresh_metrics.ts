import { supabaseRest } from "./store/supabase_client.js";
import { MetricCollectorFactory } from "./crawl/metric_collector.js";
import { insertPostMetricSnapshot, insertAuthorMetricSnapshot } from "./store/supabase_writer.js";
import { logger } from "./utils/index.js";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function refreshAllMetrics(): Promise<void> {
  logger.info("=== BẮT ĐẦU REFRESH METRICS ===", "Refresh");

  // 1. Refresh posts metrics
  let posts: any[] = [];
  try {
    posts = await supabaseRest("crawled_posts", { method: "GET" });
  } catch (err: any) {
    logger.error(`Không thể lấy danh sách crawled_posts: ${err.message}`, "Refresh");
  }

  if (Array.isArray(posts) && posts.length > 0) {
    logger.info(`Tìm thấy ${posts.length} bài đăng cần refresh.`, "Refresh");
    for (const post of posts) {
      if (!post.platform || !post.platform_id) continue;
      try {
        const collector = MetricCollectorFactory.get(post.platform);
        if (!collector) {
          logger.warn(`Bỏ qua: Platform ${post.platform} chưa được hỗ trợ.`, "Refresh");
          continue;
        }
        logger.info(`Refreshing metrics cho post: [${post.platform.toUpperCase()}] ${post.platform_id}`, "Refresh");

        const metrics = await collector.collectPostMetrics(post.platform_id);

        // Ghi nhận snapshot
        await insertPostMetricSnapshot({
          post_id: post.id,
          platform: post.platform,
          platform_post_id: post.platform_id,
          view_count: metrics.view_count,
          like_count: metrics.like_count,
          comment_count: metrics.comment_count,
          share_count: metrics.share_count,
          raw: metrics.raw || null,
          source: "refresh",
        });

        // Cập nhật stats mới nhất vào crawled_posts
        await supabaseRest("crawled_posts", {
          method: "PATCH",
          params: { id: `eq.${post.id}` },
          body: {
            stats: {
              play_count: metrics.view_count,
              like_count: metrics.like_count,
              comment_count: metrics.comment_count,
              share_count: metrics.share_count,
              digg_count: metrics.like_count,
              view_count: metrics.view_count,
            },
          },
        });

        logger.info(`✅ Cập nhật post ${post.platform_id} -> Likes: ${metrics.like_count}, Views: ${metrics.view_count}`, "Refresh");
        await sleep(1000); // Tránh rate limit
      } catch (err: any) {
        logger.error(`❌ Lỗi khi refresh post ${post.platform_id}: ${err.message}`, "Refresh");
      }
    }
  }

  // 2. Refresh authors metrics
  let authors: any[] = [];
  try {
    authors = await supabaseRest("crawled_authors", { method: "GET" });
  } catch (err: any) {
    logger.error(`Không thể lấy danh sách crawled_authors: ${err.message}`, "Refresh");
  }

  if (Array.isArray(authors) && authors.length > 0) {
    logger.info(`Tìm thấy ${authors.length} tác giả cần refresh.`, "Refresh");
    for (const author of authors) {
      if (!author.platform || !author.platform_uid) continue;
      try {
        const collector = MetricCollectorFactory.get(author.platform);
        if (!collector) {
          logger.warn(`Bỏ qua: Platform ${author.platform} chưa được hỗ trợ.`, "Refresh");
          continue;
        }
        logger.info(`Refreshing metrics cho author: [${author.platform.toUpperCase()}] ${author.platform_uid}`, "Refresh");

        const metrics = await collector.collectAuthorMetrics(author.platform_uid);

        // Ghi nhận snapshot
        await insertAuthorMetricSnapshot({
          author_id: author.id,
          platform: author.platform,
          platform_author_id: author.platform_uid,
          fans_count: metrics.fans_count,
          follows_count: metrics.follows_count,
          interaction_count: metrics.interaction_count,
          videos_count: metrics.videos_count,
          raw: metrics.raw || null,
          source: "refresh",
        });

        // Cập nhật fans_count và follows_count mới nhất vào crawled_authors
        await supabaseRest("crawled_authors", {
          method: "PATCH",
          params: { id: `eq.${author.id}` },
          body: {
            fans_count: metrics.fans_count,
            follows_count: metrics.follows_count,
            updated_at: new Date().toISOString(),
          },
        });

        logger.info(`✅ Cập nhật author ${author.nickname} -> Followers: ${metrics.fans_count}`, "Refresh");
        await sleep(1000);
      } catch (err: any) {
        logger.error(`❌ Lỗi khi refresh author ${author.id}: ${err.message}`, "Refresh");
      }
    }
  }

  logger.info("=== HOÀN THÀNH REFRESH METRICS ===", "Refresh");
}
