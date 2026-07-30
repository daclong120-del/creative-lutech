/**
 * Repository — release_ops_apps
 * Tầng duy nhất chạm bảng `release_ops_apps` trong Supabase.
 */
import type { DbClient, TableRow, JsonValue } from "./types";

export interface CreateAppInput {
  package_name: string;
  app_name: string;
  play_account_id?: string | null;
  target_sdk?: number | null;
  policy_readiness?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAppInput {
  app_name?: string;
  play_account_id?: string | null;
  target_sdk?: number | null;
  policy_readiness?: string;
  metadata?: Record<string, unknown>;
}

export class ReleaseOpsAppRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả apps, kèm join play_account name */
  async findAll(limit = 200): Promise<(TableRow<"release_ops_apps"> & { play_account?: TableRow<"release_ops_play_accounts"> | null })[]> {
    const { data, error } = await this.db
      .from("release_ops_apps")
      .select("*, release_ops_play_accounts(*)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      play_account: row.release_ops_play_accounts ?? null,
    })) as (TableRow<"release_ops_apps"> & { play_account?: TableRow<"release_ops_play_accounts"> | null })[];
  }

  /** Lấy 1 app theo ID */
  async findById(id: string): Promise<(TableRow<"release_ops_apps"> & { play_account?: TableRow<"release_ops_play_accounts"> | null }) | null> {
    const { data, error } = await this.db
      .from("release_ops_apps")
      .select("*, release_ops_play_accounts(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      play_account: (data as Record<string, unknown>).release_ops_play_accounts ?? null,
    } as TableRow<"release_ops_apps"> & { play_account?: TableRow<"release_ops_play_accounts"> | null };
  }

  /** Lấy app theo package_name */
  async findByPackageName(packageName: string): Promise<TableRow<"release_ops_apps"> | null> {
    const { data, error } = await this.db
      .from("release_ops_apps")
      .select("*")
      .eq("package_name", packageName)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Tạo app mới */
  async create(input: CreateAppInput): Promise<TableRow<"release_ops_apps">> {
    const { data, error } = await this.db
      .from("release_ops_apps")
      .insert([{
        package_name: input.package_name,
        app_name: input.app_name,
        play_account_id: input.play_account_id ?? null,
        target_sdk: input.target_sdk ?? null,
        policy_readiness: input.policy_readiness ?? "pending",
        metadata: (input.metadata ?? {}) as JsonValue,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cập nhật app */
  async update(id: string, input: UpdateAppInput): Promise<void> {
    const { error } = await this.db
      .from("release_ops_apps")
      .update({
        ...(input.app_name !== undefined && { app_name: input.app_name }),
        ...(input.play_account_id !== undefined && { play_account_id: input.play_account_id }),
        ...(input.target_sdk !== undefined && { target_sdk: input.target_sdk }),
        ...(input.policy_readiness !== undefined && { policy_readiness: input.policy_readiness }),
        ...(input.metadata !== undefined && { metadata: input.metadata as JsonValue }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  }
}
