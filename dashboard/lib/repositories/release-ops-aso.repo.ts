/**
 * Repository — release_ops_aso_metrics
 * Tầng duy nhất chạm bảng `release_ops_aso_metrics` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class ReleaseOpsASORepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy metrics theo app_id, sắp theo report_date mới nhất */
  async findByAppId(appId: string, limit = 90): Promise<TableRow<"release_ops_aso_metrics">[]> {
    const { data, error } = await this.db
      .from("release_ops_aso_metrics")
      .select("*")
      .eq("app_id", appId)
      .order("report_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy tất cả metrics gần nhất, kèm join app name */
  async findAllLatest(limit = 200): Promise<(TableRow<"release_ops_aso_metrics"> & { app?: TableRow<"release_ops_apps"> | null })[]> {
    const { data, error } = await this.db
      .from("release_ops_aso_metrics")
      .select("*, release_ops_apps(id, app_name, package_name)")
      .order("report_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      app: row.release_ops_apps ?? null,
    })) as (TableRow<"release_ops_aso_metrics"> & { app?: TableRow<"release_ops_apps"> | null })[];
  }
}
