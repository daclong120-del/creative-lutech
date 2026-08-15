/**
 * Repository — crawler_logs
 * Tầng duy nhất chạm bảng `crawler_logs` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class LogRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách log theo task_id, sắp xếp theo thời gian */
  async findByTaskId(taskId: string, limit = 200): Promise<TableRow<"crawler_logs">[]> {
    const { data, error } = await this.db
      .from("crawler_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
}
