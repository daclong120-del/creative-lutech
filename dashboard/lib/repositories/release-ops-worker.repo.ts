/**
 * Repository — release_ops_workers
 * Tầng duy nhất chạm bảng `release_ops_workers` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class ReleaseOpsWorkerRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả workers */
  async findAll(): Promise<TableRow<"release_ops_workers">[]> {
    const { data, error } = await this.db
      .from("release_ops_workers")
      .select("*")
      .order("last_heartbeat", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy 1 worker theo ID */
  async findById(id: string): Promise<TableRow<"release_ops_workers"> | null> {
    const { data, error } = await this.db
      .from("release_ops_workers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Đếm workers theo status */
  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await this.db
      .from("release_ops_workers")
      .select("status");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.status] = (counts[row.status] || 0) + 1;
    }
    return counts;
  }
}
