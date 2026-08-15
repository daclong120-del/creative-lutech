import type { DbClient } from "./types";

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  is_locked: boolean;
  created_at: string;
  permissions: string[];
}

export class RoleRepository {
  constructor(private readonly db: DbClient) {}

  /** Lấy danh sách tất cả vai trò cùng với quyền hạn tương ứng */
  async getRoles(): Promise<RoleWithPermissions[]> {
    const { data: roles, error: rolesError } = await this.db
      .from("team_roles")
      .select("*")
      .order("created_at", { ascending: true });

    if (rolesError) throw rolesError;
    if (!roles) return [];

    const { data: perms, error: permsError } = await this.db
      .from("team_role_permissions")
      .select("*");

    if (permsError) throw permsError;

    return roles.map(role => {
      const rolePerms = perms
        ? perms.filter(p => p.role_id === role.id).map(p => p.permission)
        : [];
      return {
        ...role,
        permissions: rolePerms
      };
    });
  }

  /** Lấy quyền hạn của một vai trò cụ thể */
  async getRolePermissions(roleId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from("team_role_permissions")
      .select("permission")
      .eq("role_id", roleId);

    if (error) throw error;
    return data?.map(d => d.permission) ?? [];
  }

  /** Tạo vai trò mới */
  async createRole(roleId: string, name: string, description: string): Promise<void> {
    const { error } = await this.db
      .from("team_roles")
      .insert({
        id: roleId,
        name,
        description,
        is_locked: false
      });

    if (error) throw error;
  }

  /** Cập nhật thông tin vai trò (chỉ khi chưa bị khóa) */
  async updateRole(roleId: string, name: string, description: string): Promise<void> {
    const { error } = await this.db
      .from("team_roles")
      .update({ name, description })
      .eq("id", roleId)
      .eq("is_locked", false);

    if (error) throw error;
  }

  /** Cập nhật quyền hạn cho vai trò */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    // 1. Xoá toàn bộ quyền cũ
    const { error: deleteError } = await this.db
      .from("team_role_permissions")
      .delete()
      .eq("role_id", roleId);

    if (deleteError) throw deleteError;

    if (permissions.length === 0) return;

    // 2. Thêm quyền mới
    const insertPayload = permissions.map(perm => ({
      role_id: roleId,
      permission: perm
    }));

    const { error: insertError } = await this.db
      .from("team_role_permissions")
      .insert(insertPayload);

    if (insertError) throw insertError;
  }

  /** Xoá vai trò (nếu không bị khóa) */
  async deleteRole(roleId: string): Promise<void> {
    const { error } = await this.db
      .from("team_roles")
      .delete()
      .eq("id", roleId)
      .eq("is_locked", false);

    if (error) throw error;
  }

  /** Kiểm tra xem vai trò có đang được sử dụng hay không */
  async isRoleInUse(roleId: string): Promise<boolean> {
    // 1. Check in team_members
    const { count: membersCount, error: membersError } = await this.db
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("role_id", roleId);

    if (membersError) throw membersError;
    if ((membersCount ?? 0) > 0) return true;

    // 2. Check in team_invitations
    const { count: invitesCount, error: invitesError } = await this.db
      .from("team_invitations")
      .select("*", { count: "exact", head: true })
      .eq("role_id", roleId);

    if (invitesError) throw invitesError;
    if ((invitesCount ?? 0) > 0) return true;

    // 3. Check in api_tokens
    const { count: tokensCount, error: tokensError } = await this.db
      .from("api_tokens")
      .select("*", { count: "exact", head: true })
      .eq("role_id", roleId);

    if (tokensError) throw tokensError;
    if ((tokensCount ?? 0) > 0) return true;

    return false;
  }
}
