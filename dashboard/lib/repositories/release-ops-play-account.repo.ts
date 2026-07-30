/**
 * Repository — release_ops_play_accounts
 * Tầng duy nhất chạm bảng `release_ops_play_accounts` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";

export interface CreatePlayAccountInput {
  developer_id: string;
  bucket_name: string;
  service_account_key_file?: string | null;
}

export interface UpdatePlayAccountInput {
  developer_id?: string;
  bucket_name?: string;
  service_account_key_file?: string | null;
}

export class ReleaseOpsPlayAccountRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả Play accounts */
  async findAll(): Promise<TableRow<"release_ops_play_accounts">[]> {
    const { data, error } = await this.db
      .from("release_ops_play_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Lấy 1 account theo ID */
  async findById(id: string): Promise<TableRow<"release_ops_play_accounts"> | null> {
    const { data, error } = await this.db
      .from("release_ops_play_accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Tạo Play account mới */
  async create(input: CreatePlayAccountInput): Promise<TableRow<"release_ops_play_accounts">> {
    const { data, error } = await this.db
      .from("release_ops_play_accounts")
      .insert([{
        developer_id: input.developer_id,
        bucket_name: input.bucket_name,
        service_account_key_file: input.service_account_key_file ?? null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cập nhật Play account */
  async update(id: string, input: UpdatePlayAccountInput): Promise<void> {
    const { error } = await this.db
      .from("release_ops_play_accounts")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  /** Đếm tổng số apps thuộc account */
  async countAppsByAccountId(accountId: string): Promise<number> {
    const { count, error } = await this.db
      .from("release_ops_apps")
      .select("id", { count: "exact", head: true })
      .eq("play_account_id", accountId);
    if (error) throw error;
    return count ?? 0;
  }
}
