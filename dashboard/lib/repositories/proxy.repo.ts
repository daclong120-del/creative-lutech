/**
 * Repository — crawler_proxies
 * Tầng duy nhất chạm bảng `crawler_proxies` trong Supabase.
 */
import type { DbClient, TableRow } from "./types";
import { encrypt } from "../utils/crypto";

export interface CreateProxyInput {
  host: string;
  port: number;
  username?: string | null;
  password?: string | null;
  protocol: "http" | "https" | "socks5";
  status: "active" | "inactive" | "dead";
}

export class ProxyRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy tất cả proxy, kèm tên account được gán */
  async findAll(): Promise<(TableRow<"crawler_proxies"> & { assigned_account_alias: string | null })[]> {
    // 2 query song song: proxies + accounts (thay vì join SQL phức tạp)
    const [proxiesRes, accountsRes] = await Promise.all([
      this.db
        .from("crawler_proxies")
        .select("*")
        .order("created_at", { ascending: false }),
      this.db
        .from("crawler_accounts")
        .select("id, username"),
    ]);

    if (proxiesRes.error) throw proxiesRes.error;

    const accountMap = new Map<string, string | null>(
      (accountsRes.data ?? []).map((a) => [a.id, a.username])
    );

    return (proxiesRes.data ?? []).map((row) => ({
      ...row,
      assigned_account_alias: row.assigned_account_id
        ? accountMap.get(row.assigned_account_id) ?? null
        : null,
    }));
  }

  /** Tạo nhiều proxy cùng lúc */
  async createBulk(proxies: CreateProxyInput[]): Promise<void> {
    const { error } = await this.db
      .from("crawler_proxies")
      .insert(proxies.map((p) => ({
        host: p.host,
        port: p.port,
        username: p.username,
        password: p.password ? encrypt(p.password) : null,
        protocol: p.protocol,
        status: p.status,
      })));
    if (error) throw error;
  }

  /** Xoá proxy theo ID */
  async deleteById(id: string): Promise<void> {
    const { error } = await this.db
      .from("crawler_proxies")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  /** Test kết nối proxy — TODO: thay bằng real health check khi có backend */
  async testConnection(id: string): Promise<"active" | "dead"> {
    const newStatus: "active" | "dead" = Math.random() > 0.15 ? "active" : "dead";
    const { error } = await this.db
      .from("crawler_proxies")
      .update({ status: newStatus, last_used_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return newStatus;
  }

  /** Tìm proxy theo host và port */
  async findByHostAndPort(host: string, port: number): Promise<TableRow<"crawler_proxies"> | null> {
    const { data, error } = await this.db
      .from("crawler_proxies")
      .select("*")
      .eq("host", host)
      .eq("port", port);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  /** Tạo một proxy mới */
  async create(proxy: Omit<TableRow<"crawler_proxies">, "id" | "created_at" | "last_used_at">): Promise<TableRow<"crawler_proxies">> {
    const { data, error } = await this.db
      .from("crawler_proxies")
      .insert({
        ...proxy,
        password: proxy.password ? encrypt(proxy.password) : null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Cập nhật thông tin proxy */
  async update(id: string, updates: Partial<TableRow<"crawler_proxies">>): Promise<void> {
    const finalUpdates = { ...updates };
    if (finalUpdates.password) {
      finalUpdates.password = encrypt(finalUpdates.password);
    }
    const { error } = await this.db
      .from("crawler_proxies")
      .update(finalUpdates)
      .eq("id", id);
    if (error) throw error;
  }

  /** Gỡ gán proxy của account này trên các proxy khác */
  async unassignOtherProxies(accountId: string, currentProxyId: string): Promise<void> {
    const { error } = await this.db
      .from("crawler_proxies")
      .update({ assigned_account_id: null })
      .eq("assigned_account_id", accountId)
      .neq("id", currentProxyId);
    if (error) throw error;
  }

  /** Gỡ gán toàn bộ proxy cho một account */
  async unassignAllProxiesForAccount(accountId: string): Promise<void> {
    const { error } = await this.db
      .from("crawler_proxies")
      .update({ assigned_account_id: null })
      .eq("assigned_account_id", accountId);
    if (error) throw error;
  }
}
