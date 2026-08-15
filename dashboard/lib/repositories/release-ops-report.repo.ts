/**
 * Repository — Store Performance Report
 * Truy vấn bảng `release_ops_aso_metrics` kết hợp `release_ops_apps` và `release_ops_play_accounts`.
 */
import type { DbClient, TableRow } from "./types";

export interface ReportQueryFilter {
  startDate?: string;
  endDate?: string;
  appIds?: string[];
  store?: string;
}

export interface RawASOMetricWithApp extends TableRow<"release_ops_aso_metrics"> {
  app?: (TableRow<"release_ops_apps"> & { release_ops_play_accounts?: TableRow<"release_ops_play_accounts"> | null }) | null;
}

export class ReleaseOpsReportRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy dữ liệu ASO metrics chi tiết cho báo cáo Store Performance */
  async getRawMetrics(filter: ReportQueryFilter = {}): Promise<RawASOMetricWithApp[]> {
    let query = this.db
      .from("release_ops_aso_metrics")
      .select("*, release_ops_apps(*, release_ops_play_accounts(*))")
      .order("report_date", { ascending: false });

    if (filter.startDate) {
      query = query.gte("report_date", filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte("report_date", filter.endDate);
    }
    if (filter.appIds && filter.appIds.length > 0) {
      query = query.in("app_id", filter.appIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      app: row.release_ops_apps as (TableRow<"release_ops_apps"> & { release_ops_play_accounts?: TableRow<"release_ops_play_accounts"> | null }) | null,
    })) as RawASOMetricWithApp[];
  }
}
