import type { DbClient, TableRow } from "./types";

export class InvitationRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách lời mời của một workspace */
  async getInvitations(workspaceId: string): Promise<TableRow<"team_invitations">[]> {
    const { data, error } = await this.db
      .from("team_invitations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /** Tạo lời mời mới */
  async createInvitation(
    workspaceId: string,
    email: string,
    roleId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    const { error } = await this.db
      .from("team_invitations")
      .insert({
        workspace_id: workspaceId,
        email,
        role_id: roleId,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
  }

  /** Xoá lời mời bằng email (thu hồi lời mời) */
  async deleteInvitation(workspaceId: string, email: string): Promise<void> {
    const { error } = await this.db
      .from("team_invitations")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("email", email);

    if (error) throw error;
  }

  /** Lấy thông tin lời mời qua token */
  async getInvitationByToken(token: string): Promise<TableRow<"team_invitations"> | null> {
    const { data, error } = await this.db
      .from("team_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }
}
