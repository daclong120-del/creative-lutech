/**
 * Repository — release_ops_jobs + release_ops_job_events
 * Tầng duy nhất chạm bảng `release_ops_jobs` và `release_ops_job_events` trong Supabase.
 */
import type { DbClient, TableRow, JsonValue } from "./types";

export interface CreateJobInput {
  job_type: string;
  priority?: number;
  release_id?: string | null;
  app_id?: string | null;
  payload?: Record<string, unknown>;
  idempotency_key?: string | null;
  max_attempts?: number;
  created_by?: string | null;
}

export class ReleaseOpsJobRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả jobs, mới nhất trước */
  async findAll(limit = 100): Promise<TableRow<"release_ops_jobs">[]> {
    const { data, error } = await this.db
      .from("release_ops_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy jobs theo status */
  async findByStatus(status: string, limit = 100): Promise<TableRow<"release_ops_jobs">[]> {
    const { data, error } = await this.db
      .from("release_ops_jobs")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy jobs theo job_type (ví dụ: 'upload') */
  async findByType(jobType: string, limit = 100): Promise<(TableRow<"release_ops_jobs"> & { app?: TableRow<"release_ops_apps"> | null })[]> {
    const { data, error } = await this.db
      .from("release_ops_jobs")
      .select("*, release_ops_apps(*)")
      .eq("job_type", jobType)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      app: row.release_ops_apps ?? null,
    })) as (TableRow<"release_ops_jobs"> & { app?: TableRow<"release_ops_apps"> | null })[];
  }

  /** Lấy 1 job theo ID */
  async findById(id: string): Promise<TableRow<"release_ops_jobs"> | null> {
    const { data, error } = await this.db
      .from("release_ops_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Tạo job mới */
  async create(input: CreateJobInput): Promise<TableRow<"release_ops_jobs">> {
    const { data, error } = await this.db
      .from("release_ops_jobs")
      .insert([{
        job_type: input.job_type,
        priority: input.priority ?? 0,
        release_id: input.release_id ?? null,
        app_id: input.app_id ?? null,
        payload: (input.payload ?? {}) as JsonValue,
        idempotency_key: input.idempotency_key ?? null,
        max_attempts: input.max_attempts ?? 3,
        created_by: input.created_by ?? null,
        status: "queued",
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cancel 1 job (chỉ nếu status cho phép) */
  async cancel(id: string): Promise<void> {
    const { error } = await this.db
      .from("release_ops_jobs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", ["queued", "retrying"]);
    if (error) throw error;
  }

  /** Lấy job events theo job_id */
  async getJobEvents(jobId: string): Promise<TableRow<"release_ops_job_events">[]> {
    const { data, error } = await this.db
      .from("release_ops_job_events")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** Đếm jobs theo status (dùng cho overview stats) */
  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await this.db
      .from("release_ops_jobs")
      .select("status");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.status] = (counts[row.status] || 0) + 1;
    }
    return counts;
  }
}
