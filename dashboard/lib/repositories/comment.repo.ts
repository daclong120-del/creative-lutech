/**
 * Repository — crawled_comments
 * Tầng duy nhất chạm bảng `crawled_comments` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class CommentRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách bình luận theo bài viết */
  async findByPostId(postId: string, limit = 100): Promise<TableRow<"crawled_comments">[]> {
    const { data, error } = await this.db
      .from("crawled_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
}
