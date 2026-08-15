/**
 * Repository — system_settings
 * Tầng duy nhất chạm bảng `system_settings` trong Supabase.
 */
import type { DbClient, TableRow, TableInsert } from "./types";

export class SettingsRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy cấu hình hệ thống duy nhất */
  async get(): Promise<TableRow<"system_settings"> | null> {
    const { data, error } = await this.db
      .from("system_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /** Tạo mới hoặc cập nhật cấu hình hệ thống */
  async upsert(updates: Omit<TableInsert<"system_settings">, "id">): Promise<TableRow<"system_settings">> {
    const { data, error } = await this.db
      .from("system_settings")
      .upsert({
        ...updates,
        id: "default",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
