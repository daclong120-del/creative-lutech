import { MemberRepository } from "@/lib/repositories/member.repo";
import { RoleRepository } from "@/lib/repositories/role.repo";
import { InvitationRepository } from "@/lib/repositories/invitation.repo";
import { ApiTokenRepository } from "@/lib/repositories/api-token.repo";
import type { DbClient } from "@/lib/repositories/types";
import { requireUser } from "@/lib/supabase/auth-helper";
import crypto from "crypto";

export interface MemberItem {
  id: string; // user_id or invite_id
  name: string;
  email: string;
  roleId: string;
  role: string;
  status: "Active" | "Pending";
  isSuperAdmin?: boolean;
  created_at: string;
}

export interface PermissionFlags {
  tasks: boolean;
  accounts: boolean;
  proxies: boolean;
  settings: boolean;
  members: boolean;
  logs: boolean;
}

export interface RoleItem {
  roleId: string;
  roleName: string;
  description: string;
  permissions: PermissionFlags;
  isLocked: boolean;
}

export interface ApiTokenItem {
  id: string;
  name: string;
  tokenPrefix: string;
  roleId: string;
  role: string;
  createdDate: string;
  creatorEmail?: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  status: "active" | "revoked" | "expired";
  scopes: string[];
  revokeReason: string | null;
}

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

// Helper to extract single profile object regardless of DB join shape (object or array)
function extractProfile(profiles: any): { name: string | null; email: string } | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0] || null;
  return profiles;
}

// Helper to map DB role ID to UI Role Name
function mapRoleIdToName(id: string): string {
  if (id === "admin") return "Admin";
  if (id === "user") return "User";
  // For custom roles, convert lowercase/slug back to Capitalized
  return id.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// Helper to map UI Role Name to DB role ID
function mapNameToRoleId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ─── Members ──────────────────────────────────────────────────

/** Lấy danh sách thành viên + lời mời pending */
export async function listMembers(): Promise<MemberItem[]> {
  try {
    const { createServiceClient, createClientServer } = await import("@/lib/supabase/server");
    let db: any;
    try {
      db = createServiceClient();
    } catch {
      db = await createClientServer();
    }
    
    const memberRepo = new MemberRepository(db as unknown as DbClient);
    const inviteRepo = new InvitationRepository(db as unknown as DbClient);
    const roleRepo = new RoleRepository(db as unknown as DbClient);

    const activeMembers = await memberRepo.getMembers(DEFAULT_WORKSPACE_ID);
    const pendingInvites = await inviteRepo.getInvitations(DEFAULT_WORKSPACE_ID);
    const dbRoles = await roleRepo.getRoles();

    // Map role ID to its display name
    const roleMap = new Map<string, string>();
    dbRoles.forEach(r => roleMap.set(r.id, r.name));
    const getRoleName = (id: string) => roleMap.get(id) || mapRoleIdToName(id);

    // Find the oldest active admin to mark as Super Admin (Chủ sở hữu)
    let oldestAdminId: string | null = null;
    const admins = activeMembers.filter(m => m.role_id === "admin");
    if (admins.length > 0) {
      const sortedAdmins = [...admins].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      oldestAdminId = sortedAdmins[0].user_id;
    }

    const mappedActive: MemberItem[] = activeMembers.map(m => {
      const prof = extractProfile(m.profiles);
      const email = prof?.email || "";
      const fallbackName = email.includes("@") ? email.split("@")[0] : "Team Member";
      const name = prof?.name || fallbackName;
      return {
        id: m.user_id,
        name,
        email,
        roleId: m.role_id,
        role: getRoleName(m.role_id),
        status: "Active",
        isSuperAdmin: m.user_id === oldestAdminId,
        created_at: m.created_at
      };
    });

    const mappedPending: MemberItem[] = pendingInvites.map(i => {
      const email = i.email || "";
      const fallbackName = email.includes("@") ? email.split("@")[0] : "Team Member";
      return {
        id: i.id,
        name: fallbackName,
        email,
        roleId: i.role_id || "user",
        role: getRoleName(i.role_id || "user"),
        status: "Pending",
        isSuperAdmin: false,
        created_at: i.created_at
      };
    });

    // Combine and sort: Super Admin first, then Active, then Pending
    return [...mappedActive, ...mappedPending].sort((a, b) => {
      if (a.isSuperAdmin) return -1;
      if (b.isSuperAdmin) return 1;
      if (a.status !== b.status) {
        return a.status === "Active" ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } catch (err) {
    console.error("Error in listMembers:", err);
    return [];
  }
}

/** Mời thành viên mới */
export async function inviteMember(email: string, roleId: string): Promise<{ token: string }> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const inviteRepo = new InvitationRepository(db as unknown as DbClient);
  const memberRepo = new MemberRepository(db as unknown as DbClient);

  // Check if member already exists
  const activeMembers = await memberRepo.getMembers(DEFAULT_WORKSPACE_ID);
  if (activeMembers.some(m => m.profiles?.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Thành viên với email này đã tồn tại trong nhóm.");
  }

  // Generate invite token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  await inviteRepo.createInvitation(DEFAULT_WORKSPACE_ID, email, roleId, token, expiresAt);

  return { token };
}

/** Cập nhật vai trò thành viên */
export async function updateMemberRole(userId: string, roleId: string): Promise<void> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const memberRepo = new MemberRepository(db as unknown as DbClient);

  const member = await memberRepo.getMemberByUserId(DEFAULT_WORKSPACE_ID, userId);
  if (!member) throw new Error("Thành viên không tồn tại.");

  // If changing role of admin, check if it's the last admin
  if (member.role_id === "admin" && roleId.toLowerCase() !== "admin") {
    const adminCount = await memberRepo.countAdmins(DEFAULT_WORKSPACE_ID);
    if (adminCount <= 1) {
      throw new Error("Không thể hạ quyền Admin cuối cùng của nhóm.");
    }
  }

  await memberRepo.updateMemberRole(DEFAULT_WORKSPACE_ID, userId, roleId);
}

/** Thu hồi quyền thành viên / lời mời */
export async function revokeMember(userIdOrEmail: string): Promise<void> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const memberRepo = new MemberRepository(db as unknown as DbClient);
  const inviteRepo = new InvitationRepository(db as unknown as DbClient);

  if (userIdOrEmail.includes("@")) {
    // Revoke invitation
    await inviteRepo.deleteInvitation(DEFAULT_WORKSPACE_ID, userIdOrEmail);
  } else {
    // Revoke active member
    const member = await memberRepo.getMemberByUserId(DEFAULT_WORKSPACE_ID, userIdOrEmail);
    if (!member) throw new Error("Thành viên không tồn tại.");

    if (member.role_id === "admin") {
      const adminCount = await memberRepo.countAdmins(DEFAULT_WORKSPACE_ID);
      if (adminCount <= 1) {
        throw new Error("Không thể thu hồi quyền Admin cuối cùng của nhóm.");
      }
    }

    await memberRepo.removeMember(DEFAULT_WORKSPACE_ID, userIdOrEmail);
  }
}

// ─── Roles ────────────────────────────────────────────────────

/** Lấy danh sách vai trò mapped sang UI model */
export async function listRoles(): Promise<RoleItem[]> {
  try {
    const { createServiceClient, createClientServer } = await import("@/lib/supabase/server");
    let db: any;
    try {
      db = createServiceClient();
    } catch {
      db = await createClientServer();
    }
    const roleRepo = new RoleRepository(db as unknown as DbClient);

    const dbRoles = await roleRepo.getRoles();

    const mapped = dbRoles.map(r => ({
      roleId: r.id,
      roleName: r.name,
      description: r.description || "",
      permissions: {
        tasks: Array.isArray(r.permissions) && r.permissions.includes("tasks"),
        accounts: Array.isArray(r.permissions) && r.permissions.includes("accounts"),
        proxies: Array.isArray(r.permissions) && r.permissions.includes("proxies"),
        settings: Array.isArray(r.permissions) && r.permissions.includes("settings"),
        members: Array.isArray(r.permissions) && r.permissions.includes("members"),
        logs: Array.isArray(r.permissions) && r.permissions.includes("logs")
      },
      isLocked: r.is_locked
    }));

    if (mapped.length === 0) {
      return [
        {
          roleId: "admin",
          roleName: "Admin",
          description: "Có toàn quyền quản trị, cấu hình hệ thống, quản lý tác vụ crawl và thành viên.",
          permissions: { tasks: true, accounts: true, proxies: true, settings: true, members: true, logs: true },
          isLocked: true
        },
        {
          roleId: "user",
          roleName: "User",
          description: "Chỉ xem dữ liệu, giám sát trạng thái và xem dữ liệu đã thu thập.",
          permissions: { tasks: false, accounts: false, proxies: false, settings: false, members: false, logs: true },
          isLocked: false
        }
      ];
    }
    return mapped;
  } catch (err) {
    console.error("Error in listRoles:", err);
    return [
      {
        roleId: "admin",
        roleName: "Admin",
        description: "Có toàn quyền quản trị, cấu hình hệ thống, quản lý tác vụ crawl và thành viên.",
        permissions: { tasks: true, accounts: true, proxies: true, settings: true, members: true, logs: true },
        isLocked: true
      },
      {
        roleId: "user",
        roleName: "User",
        description: "Chỉ xem dữ liệu, giám sát trạng thái và xem dữ liệu đã thu thập.",
        permissions: { tasks: false, accounts: false, proxies: false, settings: false, members: false, logs: true },
        isLocked: false
      }
    ];
  }
}

/** Tạo vai trò tùy chỉnh mới */
export async function createRole(name: string, description: string, permissions: PermissionFlags): Promise<void> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const roleRepo = new RoleRepository(db as unknown as DbClient);

  const roleId = mapNameToRoleId(name);
  if (roleId === "admin" || roleId === "user") {
    throw new Error("Không thể tạo vai trò trùng tên hệ thống mặc định.");
  }

  // Create role metadata
  await roleRepo.createRole(roleId, name, description);

  // Map permissions to strings
  const permissionStrings: string[] = [];
  if (permissions.tasks) permissionStrings.push("tasks");
  if (permissions.accounts) permissionStrings.push("accounts");
  if (permissions.proxies) permissionStrings.push("proxies");
  if (permissions.settings) permissionStrings.push("settings");
  if (permissions.members) permissionStrings.push("members");
  if (permissions.logs) permissionStrings.push("logs");

  await roleRepo.updateRolePermissions(roleId, permissionStrings);
}

/** Cập nhật quyền hạn cho vai trò */
export async function updateRolePermissions(roleId: string, permissions: PermissionFlags): Promise<void> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const roleRepo = new RoleRepository(db as unknown as DbClient);

  // Check if role is locked (cannot change admin role permissions easily)
  const dbRoles = await roleRepo.getRoles();
  const targetRole = dbRoles.find(r => r.id === roleId);
  if (!targetRole) throw new Error("Vai trò không tồn tại.");
  if (targetRole.is_locked) {
    throw new Error("Không thể chỉnh sửa vai trò hệ thống đã bị khóa.");
  }

  // Map permissions to strings
  const permissionStrings: string[] = [];
  if (permissions.tasks) permissionStrings.push("tasks");
  if (permissions.accounts) permissionStrings.push("accounts");
  if (permissions.proxies) permissionStrings.push("proxies");
  if (permissions.settings) permissionStrings.push("settings");
  if (permissions.members) permissionStrings.push("members");
  if (permissions.logs) permissionStrings.push("logs");

  await roleRepo.updateRolePermissions(roleId, permissionStrings);
}

/** Xoá vai trò tùy chỉnh */
export async function deleteRole(roleId: string): Promise<void> {
  if (roleId === "admin" || roleId === "user") {
    throw new Error("Không thể xóa vai trò hệ thống mặc định.");
  }

  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const roleRepo = new RoleRepository(db as unknown as DbClient);

  const dbRoles = await roleRepo.getRoles();
  const targetRole = dbRoles.find(r => r.id === roleId);
  if (!targetRole) throw new Error("Vai trò không tồn tại.");
  if (targetRole.is_locked) {
    throw new Error("Không thể xóa vai trò hệ thống đã bị khóa.");
  }

  // Verify role is not in use
  const inUse = await roleRepo.isRoleInUse(roleId);
  if (inUse) {
    throw new Error("Không thể xóa vai trò đang có thành viên hoặc mã truy cập sử dụng.");
  }

  await roleRepo.deleteRole(roleId);
}

// ─── API Tokens ───────────────────────────────────────────────

/** Lấy danh sách API tokens */
export async function listApiTokens(): Promise<ApiTokenItem[]> {
  try {
    const { createServiceClient, createClientServer } = await import("@/lib/supabase/server");
    let db: any;
    try {
      db = createServiceClient();
    } catch {
      db = await createClientServer();
    }
    const tokenRepo = new ApiTokenRepository(db as unknown as DbClient);
    const roleRepo = new RoleRepository(db as unknown as DbClient);

    const tokens = await tokenRepo.getApiTokens();
    const dbRoles = await roleRepo.getRoles();

    // Create role ID to display name mapping
    const roleMap = new Map<string, string>();
    dbRoles.forEach(r => roleMap.set(r.id, r.name));
    const getRoleName = (id: string) => roleMap.get(id) || mapRoleIdToName(id);

    return tokens.map(t => {
      // Check if token is expired dynamically
      let currentStatus = t.status;
      if (t.status === "active" && t.expires_at && new Date(t.expires_at) < new Date()) {
        currentStatus = "expired";
      }

      const prof = extractProfile(t.profiles);

      return {
        id: t.id,
        name: t.name,
        tokenPrefix: t.token_prefix ? `${t.token_prefix}...` : "sm_live...",
        roleId: t.role_id,
        role: getRoleName(t.role_id),
        createdDate: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        creatorEmail: prof?.email || undefined,
        expiresAt: t.expires_at ? new Date(t.expires_at).toISOString() : null,
        lastUsedAt: t.last_used_at ? new Date(t.last_used_at).toISOString() : null,
        status: currentStatus || "active",
        scopes: t.scopes || ["*"],
        revokeReason: t.revoke_reason || null
      };
    });
  } catch (err) {
    console.error("Error in listApiTokens:", err);
    return [];
  }
}

/** Tạo API token mới (trả về raw token chính xác 1 lần) */
export async function createApiToken(
  name: string,
  roleId: string,
  expiresDays?: number
): Promise<{ rawToken: string }> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const tokenRepo = new ApiTokenRepository(db as unknown as DbClient);

  const user = await requireUser();

  // Generate random secure token
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawToken = `sm_live_${randomBytes}`;
  const tokenPrefix = `sm_live_${randomBytes.substring(0, 8)}`;
  
  // Hash the token using SHA-256
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Calculate expiration date
  let expiresAt: string | null = null;
  if (expiresDays && expiresDays > 0) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expiresDays);
    expiresAt = expDate.toISOString();
  }

  const defaultScopes = [
    "crawler:claim", 
    "crawler:write_logs", 
    "crawler:update_task", 
    "crawler:read_task",
    "crawler:write_data",
    "crawler:read_data",
    "crawler:read_accounts",
    "crawler:update_accounts",
    "crawler:write_accounts",
    "crawler:update_data"
  ];
  await tokenRepo.createApiToken(name, tokenHash, tokenPrefix, roleId, user.id, expiresAt, defaultScopes);

  return { rawToken };
}

/** Thu hồi API token */
export async function revokeApiToken(tokenId: string, reason = "User revoked"): Promise<void> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const tokenRepo = new ApiTokenRepository(db as unknown as DbClient);

  await tokenRepo.revokeApiToken(tokenId, reason);
}
