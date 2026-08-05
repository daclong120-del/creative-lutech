/**
 * Repository — release_ops_artifacts
 * Tầng duy nhất chạm bảng `release_ops_artifacts` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export class ReleaseOpsArtifactRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách artifacts của 1 release theo release_id */
  async findByReleaseId(releaseId: string): Promise<TableRow<"release_ops_artifacts">[]> {
    const { data, error } = await this.db
      .from("release_ops_artifacts")
      .select("*")
      .eq("release_id", releaseId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy tất cả artifacts với giới hạn limit */
  async findAll(limit = 200): Promise<TableRow<"release_ops_artifacts">[]> {
    const { data, error } = await this.db
      .from("release_ops_artifacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy 1 artifact theo ID */
  async findById(id: string): Promise<TableRow<"release_ops_artifacts"> | null> {
    const { data, error } = await this.db
      .from("release_ops_artifacts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}
