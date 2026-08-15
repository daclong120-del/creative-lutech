import type { DbClient } from "./types";

export interface MemberWithProfile {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: string;
  status: string;
  created_at: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
}

export class MemberRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách thành viên trong workspace */
  async getMembers(workspaceId: string): Promise<MemberWithProfile[]> {
    const { data, error } = await this.db
      .from("team_members")
      .select(`
        id,
        workspace_id,
        user_id,
        role_id,
        status,
        created_at,
        profiles (
          name,
          email
        )
      `)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return (data as unknown as MemberWithProfile[]) ?? [];
  }

  /** Lấy thông tin thành viên bằng user_id */
  async getMemberByUserId(workspaceId: string, userId: string): Promise<MemberWithProfile | null> {
    const { data, error } = await this.db
      .from("team_members")
      .select(`
        id,
        workspace_id,
        user_id,
        role_id,
        status,
        created_at,
        profiles (
          name,
          email
        )
      `)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as MemberWithProfile) ?? null;
  }

  /** Thêm thành viên mới */
  async addMember(workspaceId: string, userId: string, roleId: string, status: "active" | "pending" = "active"): Promise<void> {
    const { error } = await this.db
      .from("team_members")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role_id: roleId,
        status
      });

    if (error) throw error;
  }

  /** Cập nhật vai trò thành viên */
  async updateMemberRole(workspaceId: string, userId: string, roleId: string): Promise<void> {
    const { error } = await this.db
      .from("team_members")
      .update({ role_id: roleId })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  /** Xoá thành viên (thu hồi quyền) */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from("team_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  /** Đếm số lượng Admin trong workspace */
  async countAdmins(workspaceId: string): Promise<number> {
    const { count, error } = await this.db
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("role_id", "admin");

    if (error) throw error;
    return count ?? 0;
  }
}
