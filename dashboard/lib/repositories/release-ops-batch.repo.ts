/**
 * Repository — release_ops_batch_operations
 * Tầng duy nhất chạm bảng `release_ops_batch_operations` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class ReleaseOpsBatchRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả batch operations, sắp mới nhất */
  async findAll(limit = 50): Promise<TableRow<"release_ops_batch_operations">[]> {
    const { data, error } = await this.db
      .from("release_ops_batch_operations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy chi tiết 1 batch */
  async findById(id: string): Promise<TableRow<"release_ops_batch_operations"> | null> {
    const { data, error } = await this.db
      .from("release_ops_batch_operations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}
