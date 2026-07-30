/**
 * Repository — release_ops_audits
 * Tầng duy nhất chạm bảng `release_ops_audits` trong Supabase.
 */
import type { DbClient, TableRow, JsonValue } from "./types";

export interface CreateAuditInput {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
  ip_address?: string | null;
}

export class ReleaseOpsAuditRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy audit log, mới nhất trước */
  async findAll(limit = 100): Promise<TableRow<"release_ops_audits">[]> {
    const { data, error } = await this.db
      .from("release_ops_audits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy audits theo entity */
  async findByEntity(entityType: string, entityId: string): Promise<TableRow<"release_ops_audits">[]> {
    const { data, error } = await this.db
      .from("release_ops_audits")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Ghi 1 audit entry */
  async create(input: CreateAuditInput): Promise<void> {
    const { error } = await this.db
      .from("release_ops_audits")
      .insert([{
        user_id: input.user_id ?? null,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        details: (input.details ?? {}) as JsonValue,
        ip_address: input.ip_address ?? null,
      }]);
    if (error) throw error;
  }
}
