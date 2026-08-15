/**
 * Repository — crawler_accounts
 * Tầng duy nhất chạm bảng `crawler_accounts` trong Supabase.
 */
import type { DbClient, TableRow, TableUpdate } from "./types";

import { encrypt } from "../utils/crypto";

export class AccountRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả tài khoản crawler cùng với thông tin proxy gán kèm (raw database join) */
  async findAll(): Promise<(TableRow<"crawler_accounts"> & {
    crawler_proxies: Pick<TableRow<"crawler_proxies">, "host" | "port" | "username" | "password">[];
  })[]> {
    const { data, error } = await this.db
      .from("crawler_accounts")
      .select("*, crawler_proxies(host, port, username, password)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as unknown as (TableRow<"crawler_accounts"> & {
      crawler_proxies: Pick<TableRow<"crawler_proxies">, "host" | "port" | "username" | "password">[];
    })[]) ?? [];
  }

  /** Lấy thông tin platform + status (cho platform health metrics) */
  async findAllWithStatus(): Promise<Pick<TableRow<"crawler_accounts">, "platform" | "status">[]> {
    const { data, error } = await this.db
      .from("crawler_accounts")
      .select("platform, status");
    if (error) throw error;
    return (data as Pick<TableRow<"crawler_accounts">, "platform" | "status">[]) ?? [];
  }

  /** Thêm mới hoặc cập nhật tài khoản (nếu trùng platform và username) */
  async createOrUpdate(platform: string, username: string, cookieData: string): Promise<TableRow<"crawler_accounts">> {
    const { data, error } = await this.db
      .from("crawler_accounts")
      .upsert(
        {
          platform,
          username,
          cookie_data: encrypt(cookieData),
          status: "active",
          failure_count: 0,
          last_used_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform,username" }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cập nhật trạng thái tài khoản (ví dụ: unban) */
  async updateStatus(id: string, status: "active" | "expired" | "banned"): Promise<void> {
    const updates: TableUpdate<"crawler_accounts"> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "active") {
      updates.failure_count = 0;
    }
    const { error } = await this.db
      .from("crawler_accounts")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  }

  /** Tìm tài khoản theo platform và username */
  async findByPlatformAndUsername(platform: string, username: string): Promise<TableRow<"crawler_accounts"> | null> {
    const { data, error } = await this.db
      .from("crawler_accounts")
      .select("*")
      .eq("platform", platform)
      .eq("username", username)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Xóa tài khoản theo ID */
  async deleteById(id: string): Promise<void> {
    const { error } = await this.db
      .from("crawler_accounts")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

