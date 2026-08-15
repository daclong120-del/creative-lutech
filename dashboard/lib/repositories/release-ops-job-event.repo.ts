/**
 * Repository — release_ops_job_events
 * Tầng duy nhất chạm bảng `release_ops_job_events` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class ReleaseOpsJobEventRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách sự kiện của 1 job theo job_id */
  async findByJobId(jobId: string): Promise<TableRow<"release_ops_job_events">[]> {
    const { data, error } = await this.db
      .from("release_ops_job_events")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
}
