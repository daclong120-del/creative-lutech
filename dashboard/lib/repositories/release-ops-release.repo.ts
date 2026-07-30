/**
 * Repository — release_ops_releases
 * Tầng duy nhất chạm bảng `release_ops_releases` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export interface CreateReleaseInput {
  app_id: string;
  version_name: string;
  version_code: number;
  track: string;
  rollout_percentage?: number;
  status?: string;
  release_notes?: string | null;
  batch_operation_id?: string | null;
}

export class ReleaseOpsReleaseRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả releases, kèm join app info */
  async findAll(limit = 100): Promise<(TableRow<"release_ops_releases"> & { app?: TableRow<"release_ops_apps"> | null })[]> {
    const { data, error } = await this.db
      .from("release_ops_releases")
      .select("*, release_ops_apps(*, release_ops_play_accounts(*))")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      app: row.release_ops_apps ?? null,
    })) as (TableRow<"release_ops_releases"> & { app?: TableRow<"release_ops_apps"> | null })[];
  }

  /** Lấy releases theo app_id */
  async findByAppId(appId: string): Promise<TableRow<"release_ops_releases">[]> {
    const { data, error } = await this.db
      .from("release_ops_releases")
      .select("*")
      .eq("app_id", appId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy 1 release theo ID */
  async findById(id: string): Promise<TableRow<"release_ops_releases"> | null> {
    const { data, error } = await this.db
      .from("release_ops_releases")
      .select("*, release_ops_apps(*, release_ops_play_accounts(*))")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Tạo release mới */
  async create(input: CreateReleaseInput): Promise<TableRow<"release_ops_releases">> {
    const { data, error } = await this.db
      .from("release_ops_releases")
      .insert([{
        app_id: input.app_id,
        version_name: input.version_name,
        version_code: input.version_code,
        track: input.track,
        rollout_percentage: input.rollout_percentage ?? 100,
        status: input.status ?? "draft",
        release_notes: input.release_notes ?? null,
        batch_operation_id: input.batch_operation_id ?? null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cập nhật status của release */
  async updateStatus(id: string, status: string, rolloutPercentage?: number): Promise<void> {
    const { error } = await this.db
      .from("release_ops_releases")
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(rolloutPercentage !== undefined && { rollout_percentage: rolloutPercentage }),
      })
      .eq("id", id);
    if (error) throw error;
  }
}
