"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/supabase/auth-helper";
import { logAuditEvent } from "@/lib/services/system.service";
import * as memberService from "@/lib/services/member.service";
import { verifyCSRF } from "@/lib/csrf";

// Helper to get client IP
async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/** Server Action: Mời thành viên mới */
export async function inviteMemberAction(email: string, roleId: string) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    // 1. Check admin permission
    const actor = await requireAdmin();

    // 2. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "Định dạng email không hợp lệ." };
    }

    if (!roleId) {
      return { error: "Vai trò không được để trống." };
    }

    // 3. Perform invite
    const result = await memberService.inviteMember(email, roleId);

    // 4. Log Audit Event
    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "invite_member",
      entity_type: "member",
      entity_id: email,
      payload: { email, role: roleId },
      ip_address: ipAddress
    });

    // 5. Revalidate Path
    revalidatePath("/dash/manage-account/members");

    return { success: true, token: result.token };
  } catch (err) {
    console.error("inviteMemberAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể mời thành viên." };
  }
}

/** Server Action: Cập nhật vai trò thành viên */
export async function updateMemberRoleAction(userId: string, roleId: string) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!userId || !roleId) {
      return { error: "Thiếu thông tin người dùng hoặc vai trò." };
    }

    // Secure check: prevent self-demotion if last admin
    if (userId === actor.id && roleId.toLowerCase() !== "admin") {
      return { error: "Bạn không thể tự hạ quyền Admin của chính mình." };
    }

    await memberService.updateMemberRole(userId, roleId);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "update_member_role",
      entity_type: "member",
      entity_id: userId,
      payload: { role: roleId },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");
    return { success: true };
  } catch (err) {
    console.error("updateMemberRoleAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể cập nhật vai trò." };
  }
}

/** Server Action: Thu hồi quyền truy cập / Xóa thành viên */
export async function revokeMemberAction(userIdOrEmail: string) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!userIdOrEmail) {
      return { error: "Thiếu thông tin người dùng để thu hồi." };
    }

    // Secure check: prevent self-revocation
    if (userIdOrEmail === actor.id || userIdOrEmail.toLowerCase() === actor.email.toLowerCase()) {
      return { error: "Bạn không thể tự thu hồi quyền truy cập của chính mình." };
    }

    await memberService.revokeMember(userIdOrEmail);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "revoke_member",
      entity_type: "member",
      entity_id: userIdOrEmail,
      payload: { target: userIdOrEmail },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");
    return { success: true };
  } catch (err) {
    console.error("revokeMemberAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể thu hồi quyền." };
  }
}

/** Server Action: Tạo vai trò mới */
export async function createRoleAction(name: string, description: string, permissions: memberService.PermissionFlags) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!name || name.trim() === "") {
      return { error: "Tên vai trò không được để trống." };
    }

    await memberService.createRole(name.trim(), description, permissions);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "create_role",
      entity_type: "role",
      entity_id: name,
      payload: { name, description, permissions },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");
    return { success: true };
  } catch (err) {
    console.error("createRoleAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể tạo vai trò mới." };
  }
}

/** Server Action: Cập nhật quyền hạn cho vai trò */
export async function updateRolePermissionsAction(roleId: string, permissions: memberService.PermissionFlags) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!roleId) {
      return { error: "ID vai trò không được để trống." };
    }

    await memberService.updateRolePermissions(roleId, permissions);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "update_role_permissions",
      entity_type: "role",
      entity_id: roleId,
      payload: { permissions },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");
    return { success: true };
  } catch (err) {
    console.error("updateRolePermissionsAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể cập nhật quyền vai trò." };
  }
}

/** Server Action: Xóa vai trò tùy chỉnh */
export async function deleteRoleAction(roleId: string) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!roleId) {
      return { error: "ID vai trò không được để trống." };
    }

    await memberService.deleteRole(roleId);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "delete_role",
      entity_type: "role",
      entity_id: roleId,
      payload: { roleId },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");
    return { success: true };
  } catch (err) {
    console.error("deleteRoleAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể xóa vai trò." };
  }
}

/** Server Action: Tạo API Token mới */
export async function createApiTokenAction(name: string, roleId: string, expiresDays?: number) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!name || name.trim() === "") {
      return { error: "Tên Token không được để trống." };
    }
    if (!roleId) {
      return { error: "Vai trò Token không được để trống." };
    }

    const result = await memberService.createApiToken(name.trim(), roleId, expiresDays);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "create_api_token",
      entity_type: "api_token",
      entity_id: name,
      payload: { name, role: roleId },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");

    return { success: true, rawToken: result.rawToken };
  } catch (err) {
    console.error("createApiTokenAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể tạo API Token." };
  }
}

/** Server Action: Thu hồi API Token */
export async function revokeApiTokenAction(tokenId: string, tokenName: string) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    if (!tokenId) {
      return { error: "Thiếu ID Token để thu hồi." };
    }

    await memberService.revokeApiToken(tokenId);

    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "revoke_api_token",
      entity_type: "api_token",
      entity_id: tokenId,
      payload: { name: tokenName },
      ip_address: ipAddress
    });

    revalidatePath("/dash/manage-account/members");
    return { success: true };
  } catch (err) {
    console.error("revokeApiTokenAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể thu hồi API Token." };
  }
}
