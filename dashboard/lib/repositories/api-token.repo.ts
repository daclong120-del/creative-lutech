import type { DbClient } from "./types";

export interface ApiTokenWithCreator {
  id: string;
  name: string;
  token_prefix: string;
  role_id: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  status: "active" | "revoked" | "expired";
  scopes: string[];
  revoke_reason: string | null;
  profiles: {
    email: string;
  } | null;
}

export class ApiTokenRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách API Tokens cùng thông tin người tạo */
  async getApiTokens(): Promise<ApiTokenWithCreator[]> {
    const { data, error } = await this.db
      .from("api_tokens")
      .select(`
        id,
        name,
        token_prefix,
        role_id,
        created_at,
        expires_at,
        last_used_at,
        status,
        scopes,
        revoke_reason,
        profiles (
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as unknown as ApiTokenWithCreator[]) ?? [];
  }

  /** Tạo API Token mới */
  async createApiToken(
    name: string,
    tokenHash: string,
    tokenPrefix: string,
    roleId: string,
    createdBy: string,
    expiresAt: string | null,
    scopes: string[] = ["*"]
  ): Promise<void> {
    const { error } = await this.db
      .from("api_tokens")
      .insert({
        name,
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        role_id: roleId,
        created_by: createdBy,
        expires_at: expiresAt,
        status: "active",
        scopes
      });

    if (error) throw error;
  }

  /** Thu hồi API Token (Soft Revoke) */
  async revokeApiToken(tokenId: string, reason = "User revoked"): Promise<void> {
    const { error } = await this.db
      .from("api_tokens")
      .update({
        status: "revoked",
        revoke_reason: reason
      })
      .eq("id", tokenId);

    if (error) throw error;
  }
}
