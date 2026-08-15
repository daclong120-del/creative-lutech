/**
 * Repository — crawled_posts
 * Tầng duy nhất chạm bảng `crawled_posts` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export interface PostQueryOpts {
  platform?: string;
  platforms?: string[];
  search?: string;
  tag?: string;
  timeRange?: "7d" | "30d" | "90d" | "all";
  sort?: "newest" | "oldest" | "views" | "likes" | "comments";
  limit?: number;
  offset?: number;
  mediaType?: "video" | "image" | "all";
}

export class PostRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách bài viết có phân trang + lọc + sắp xếp */
  async findMany(opts: PostQueryOpts = {}): Promise<{
    data: TableRow<"crawled_posts">[];
    count: number;
  }> {
    const limit = opts.limit ?? 50;
    let query = this.db
      .from("crawled_posts")
      .select("*", { count: "exact" });

    // Lọc theo platform
    if (opts.platforms && opts.platforms.length > 0) {
      query = query.in("platform", opts.platforms);
    } else if (opts.platform && opts.platform !== "all") {
      query = query.eq("platform", opts.platform);
    }

    // Tìm kiếm theo caption
    if (opts.search) {
      query = query.ilike("caption", `%${opts.search}%`);
    }

    // Lọc theo tag
    if (opts.tag) {
      query = query.contains("tags", [opts.tag]);
    }

    // Lọc theo khoảng thời gian
    if (opts.timeRange && opts.timeRange !== "all") {
      const now = new Date();
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      const startDate = new Date();
      startDate.setDate(now.getDate() - daysMap[opts.timeRange]);
      query = query.gte("published_at", startDate.toISOString());
    }

    // Lọc theo media type
    if (opts.mediaType && opts.mediaType !== "all") {
      if (opts.mediaType === "video") {
        query = query.not("cover_url", "is", null);
      } else if (opts.mediaType === "image") {
        query = query.is("cover_url", null);
      }
    }

    // Sắp xếp
    const sort = opts.sort ?? "newest";
    // Supabase supports JSON path ordering at runtime, but generated table column types do not include it.
    const orderByJsonStat = (column: "stats->play_count" | "stats->like_count" | "stats->comment_count") =>
      column as unknown as "published_at";

    if (sort === "newest") {
      query = query.order("published_at", { ascending: false, nullsFirst: false });
    } else if (sort === "oldest") {
      query = query.order("published_at", { ascending: true, nullsFirst: true });
    } else if (sort === "views") {
      query = query.order(orderByJsonStat("stats->play_count"), { ascending: false });
    } else if (sort === "likes") {
      query = query.order(orderByJsonStat("stats->like_count"), { ascending: false });
    } else if (sort === "comments") {
      query = query.order(orderByJsonStat("stats->comment_count"), { ascending: false });
    }

    // Phân trang
    const offset = opts.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  /** Đếm tổng số bài viết */
  async count(): Promise<number> {
    const { count, error } = await this.db
      .from("crawled_posts")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  }

  /** Đếm bài viết theo từng platform */
  async countByPlatform(): Promise<Record<string, number>> {
    const { data, error } = await this.db
      .from("crawled_posts")
      .select("platform");
    if (error) throw error;

    const counts: Record<string, number> = {};
    (data ?? []).forEach((row) => {
      if (row.platform) {
        counts[row.platform] = (counts[row.platform] || 0) + 1;
      }
    });
    return counts;
  }

  /** Đếm bài viết theo ngày trong N ngày gần nhất */
  async countByDay(days: number): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.db
      .from("crawled_posts")
      .select("published_at")
      .gte("published_at", since.toISOString());
    if (error) throw error;

    const counts: Record<string, number> = {};
    (data ?? []).forEach((row) => {
      if (!row.published_at) return;
      const d = row.published_at.split("T")[0];
      counts[d] = (counts[d] || 0) + 1;
    });

    return Object.keys(counts)
      .sort()
      .slice(-days)
      .map((date) => ({ date, count: counts[date] }));
  }

  /** Lấy chi tiết 1 bài viết theo ID */
  async findById(id: string): Promise<TableRow<"crawled_posts"> | null> {
    const { data, error } = await this.db
      .from("crawled_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Lấy bài viết theo author_id */
  async findByAuthorId(authorId: string, limit = 50): Promise<{
    data: TableRow<"crawled_posts">[];
    count: number;
  }> {
    const { data, error, count } = await this.db
      .from("crawled_posts")
      .select("*", { count: "exact" })
      .eq("author_id", authorId)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  /** Xóa 1 bài viết theo ID */
  async deleteById(id: string): Promise<void> {
    const { error } = await this.db
      .from("crawled_posts")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  /** Xóa nhiều bài viết theo danh sách IDs */
  async deleteByIds(ids: string[]): Promise<{ deletedCount: number }> {
    if (ids.length === 0) return { deletedCount: 0 };
    const { error, count } = await this.db
      .from("crawled_posts")
      .delete({ count: "exact" })
      .in("id", ids);
    if (error) throw error;
    return { deletedCount: count ?? ids.length };
  }
}
