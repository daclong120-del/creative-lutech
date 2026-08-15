/**
 * Repository — audit_logs + exported_files
 * Tầng duy nhất chạm bảng `audit_logs` và `exported_files` trong Supabase.
 */
import type { DbClient, TableRow, JsonValue } from "./types";

export interface AuditEventInput {
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  ip_address: string;
}

export interface ExportFileInput {
  filename: string;
  type: "xlsx" | "csv";
  filter_snapshot: Record<string, unknown>;
  size_bytes: number;
  created_by: string;
  download_url: string;
}

export class AuditRepository {
  constructor(private readonly db: DbClient) {}

  // ─── Audit Logs ──────────────────────────────────────────────

  /** Lấy danh sách audit log, mới nhất trước */
  async getAuditLogs(limit = 100): Promise<TableRow<"audit_logs">[]> {
    const { data, error } = await this.db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Ghi 1 sự kiện audit */
  async logEvent(event: AuditEventInput): Promise<void> {
    const { error } = await this.db
      .from("audit_logs")
      .insert([{
        actor_id: event.actor_id,
        action: event.action,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: event.payload as JsonValue,
        ip_address: event.ip_address,
      }]);
    if (error) throw error;
  }

  // ─── Exported Files ──────────────────────────────────────────

  /** Lấy danh sách file đã xuất */
  async getExports(): Promise<TableRow<"exported_files">[]> {
    const { data, error } = await this.db
      .from("exported_files")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Ghi 1 bản ghi file xuất mới */
  async logExport(file: ExportFileInput): Promise<void> {
    const { error } = await this.db
      .from("exported_files")
      .insert([{
        filename: file.filename,
        type: file.type,
        filter_snapshot: file.filter_snapshot as JsonValue,
        size_bytes: file.size_bytes,
        created_by: file.created_by,
        download_url: file.download_url,
      }]);
    if (error) throw error;
  }
}
