/**
 * Repository — crawler_tasks
 * Tầng duy nhất chạm bảng `crawler_tasks` trong Supabase.
 */
import type { DbClient, TableRow, JsonValue } from "./types";

export interface CreateTaskInput {
  platform: string;
  command: string;
  target: string;
  priority?: string;
  scheduled_at?: string | null;
  metadata?: Record<string, unknown>;
}

export class TaskRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả task, sắp xếp theo ngày tạo mới nhất */
  async findAll(limit = 100): Promise<TableRow<"crawler_tasks">[]> {
    const { data, error } = await this.db
      .from("crawler_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy task với trạng thái cụ thể (dùng cho metrics) */
  async findAllWithStatus(): Promise<Pick<TableRow<"crawler_tasks">, "id" | "status">[]> {
    const { data, error } = await this.db
      .from("crawler_tasks")
      .select("id, status");
    if (error) throw error;
    return (data as Pick<TableRow<"crawler_tasks">, "id" | "status">[]) ?? [];
  }

  /** Lấy một task theo ID */
  async findById(id: string): Promise<TableRow<"crawler_tasks"> | null> {
    const { data, error } = await this.db
      .from("crawler_tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Tạo task mới */
  async create(input: CreateTaskInput): Promise<TableRow<"crawler_tasks">> {
    const { data, error } = await this.db
      .from("crawler_tasks")
      .insert([{
        platform: input.platform,
        command: input.command,
        target: input.target,
        priority: input.priority ?? "normal",
        status: "pending",
        scheduled_at: input.scheduled_at ?? null,
        metadata: (input.metadata ?? {}) as JsonValue,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cập nhật trạng thái task */
  async updateStatus(id: string, status: TableRow<"crawler_tasks">["status"]): Promise<void> {
    const updates: Partial<TableRow<"crawler_tasks">> = { status };
    if (status === "pending") {
      updates.error_message = null;
      const existing = await this.findById(id);
      if (existing && existing.metadata && typeof existing.metadata === "object") {
        const meta = { ...(existing.metadata as Record<string, unknown>) };
        meta.phase = "pending";
        delete meta.result_state;
        delete meta.stop_reason;
        if (meta.progress && typeof meta.progress === "object") {
          meta.progress = {
            ...(meta.progress as Record<string, unknown>),
            current: 0,
          };
        }
        updates.metadata = meta as JsonValue;
      }
    }
    const { error } = await this.db
      .from("crawler_tasks")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  }

  /** Tạo hàng loạt task qua RPC (atomic, dedup) */
  async createBulk(tasks: CreateTaskInput[]): Promise<{
    inserted_count: number;
    skipped_count: number;
    errors: string[];
  } | null> {
    const { data, error } = await this.db
      .rpc("create_crawler_tasks", { p_tasks: tasks as unknown as JsonValue });
    if (error) throw error;
    return data as {
      inserted_count: number;
      skipped_count: number;
      errors: string[];
    };
  }
}

