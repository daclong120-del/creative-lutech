/**
 * Service — Data Management (Posts, Authors, Comments)
 * Phục vụ các trang Data > Posts, Data > Authors, Data > Management.
 */
import { createClientServer, createServiceClient } from "@/lib/supabase/server";
import { PostRepository, type PostQueryOpts } from "@/lib/repositories/post.repo";
import { AuthorRepository, type AuthorQueryOpts } from "@/lib/repositories/author.repo";
import { CommentRepository } from "@/lib/repositories/comment.repo";
import type { DbClient } from "@/lib/repositories/types";
import type { CrawledPost, CrawledAuthor, CrawledComment, Platform } from "@/types";

// ─── Mappers (chuyển DB row → app type) ──────────────────────

function mapDbPost(row: Record<string, unknown>): CrawledPost {
  const stats = (row.stats as Record<string, number>) || {};
  const raw = (row.raw as Record<string, unknown>) || {};
  return {
    id: row.id as string,
    platform: row.platform as Platform,
    author_id: (row.author_id as string) || "",
    platform_uid: (row.platform_id as string) || "",
    title: (raw.title as string) || (row.caption as string)?.slice(0, 50) || "",
    caption: (row.caption as string) || "",
    cover_url: (row.cover_url as string) || "",
    like_count: stats.digg_count || stats.like_count || 0,
    view_count: stats.play_count || stats.view_count || 0,
    comment_count: stats.comment_count || 0,
    media_urls: (row.media_urls as string[]) || [],
    tags: (row.tags as string[]) || [],
    published_at: (row.published_at as string) || "",
    crawled_at: (row.crawled_at as string) || "",
  };
}

function mapDbAuthor(row: Record<string, unknown>): CrawledAuthor {
  return {
    id: row.id as string,
    platform_uid: (row.platform_uid as string) || "",
    nickname: (row.nickname as string) || "Unknown",
    platform: row.platform as Platform,
    gender: (row.gender as "male" | "female" | "unknown") || "unknown",
    description: (row.description as string) || "",
    fans_count: (row.fans_count as number) || 0,
    follows_count: (row.follows_count as number) || 0,
    ip_location: (row.ip_location as string) || "",
    avatar_url: (row.avatar_url as string) || "",
    crawled_at: (row.updated_at as string) || (row.created_at as string) || "",
  };
}

function mapDbComment(row: Record<string, unknown>): CrawledComment {
  return {
    id: row.id as string,
    post_id: (row.post_id as string) || "",
    parent_cid: (row.parent_cid as string) || null,
    content: (row.content as string) || "",
    like_count: (row.like_count as number) || 0,
    created_at: (row.published_at as string) || (row.crawled_at as string) || "",
    author_nickname: (row.author_nickname as string) || "Anonymous",
  };
}

// ─── Service Functions ───────────────────────────────────────

/** Lấy danh sách bài viết đã map sang app type */
export async function getPosts(opts?: PostQueryOpts): Promise<{ data: CrawledPost[]; total: number }> {
  const db = await createClientServer();
  const repo = new PostRepository(db as unknown as DbClient);
  const { data, count } = await repo.findMany(opts);
  return { data: data.map(mapDbPost), total: count };
}

/** Lấy danh sách tác giả đã map sang app type */
export async function getAuthors(opts?: AuthorQueryOpts): Promise<{ data: CrawledAuthor[]; total: number }> {
  const db = await createClientServer();
  const repo = new AuthorRepository(db as unknown as DbClient);
  const { data, count } = await repo.findMany(opts);
  return { data: data.map(mapDbAuthor), total: count };
}

/** Lấy danh sách bình luận theo bài viết */
export async function getComments(postId: string): Promise<CrawledComment[]> {
  const db = await createClientServer();
  const repo = new CommentRepository(db as unknown as DbClient);
  const data = await repo.findByPostId(postId);
  return data.map(mapDbComment);
}

/** Lấy danh sách tags — TODO: cần migration bảng post_tags */
export function getTags(): { id: string; name: string; color: string; description: string; usage_count: number; created_at: string }[] {
  return [];
}

/** Xóa 1 bài viết theo ID (dùng service role — bypass RLS) */
export async function deletePost(id: string): Promise<void> {
  const db = createServiceClient();
  const repo = new PostRepository(db as unknown as DbClient);
  await repo.deleteById(id);
}

/** Xóa nhiều bài viết theo danh sách IDs (dùng service role — bypass RLS) */
export async function deletePosts(ids: string[]): Promise<{ deletedCount: number }> {
  const db = createServiceClient();
  const repo = new PostRepository(db as unknown as DbClient);
  return repo.deleteByIds(ids);
}
