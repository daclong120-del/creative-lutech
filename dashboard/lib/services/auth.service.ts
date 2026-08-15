/**
 * Service — Authentication (Sign In, Sign Up)
 * Đóng gói logic nghiệp vụ xác thực và chế độ bypass demo local.
 */
import { createClientServer } from "@/lib/supabase/server";
import { InvitationRepository } from "@/lib/repositories/invitation.repo";
import { MemberRepository } from "@/lib/repositories/member.repo";
import type { DbClient } from "@/lib/repositories/types";

export class AuthService {
  /**
   * Đăng nhập tài khoản
   */
  static async login(email: string, password: string, captchaToken?: string) {
    try {
      const supabase = await createClientServer();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (process.env.NODE_ENV === "development") {
        if (password === "testpassword123" || email.includes("test")) {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          cookieStore.set("sinomedia_dev_user", email, { path: "/", maxAge: 86400 });
          return {
            user: { id: email.includes("admin") ? "dev-admin-id" : "dev-user-id", email } as any,
            session: { access_token: "dev-mock-token" } as any,
          };
        }
      }
      if (errMsg.includes("fetch failed") || errMsg.includes("ECONNREFUSED")) {
        throw new Error("Khong ket noi duoc Supabase Auth. Kiem tra NEXT_PUBLIC_SUPABASE_URL va Supabase project.");
      }
      throw err;
    }
  }

  /**
   * Đăng ký tài khoản
   */
  static async signUp(email: string, password: string, inviteToken?: string, captchaToken?: string) {
    const supabase = await createClientServer();

    // Nếu đăng ký theo lời mời, kiểm tra token trước
    let invitation = null;
    if (inviteToken) {
      const inviteRepo = new InvitationRepository(supabase as unknown as DbClient);
      invitation = await inviteRepo.getInvitationByToken(inviteToken);
      if (!invitation) {
        throw new Error("Liên kết lời mời không hợp lệ hoặc đã hết hạn.");
      }
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error(`Lời mời này dành cho email ${invitation.email}, không phải ${email}.`);
      }
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error("Liên kết lời mời đã hết hạn.");
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error) throw error;

    // Nếu đăng ký thành công và có lời mời hợp lệ, tiến hành gán quyền và xóa lời mời
    if (data.user && invitation) {
      const memberRepo = new MemberRepository(supabase as unknown as DbClient);
      const inviteRepo = new InvitationRepository(supabase as unknown as DbClient);
      
      const workspaceId = invitation.workspace_id || "00000000-0000-0000-0000-000000000000";
      const roleId = invitation.role_id || "user";
      
      // Thêm user vào workspace team_members
      await memberRepo.addMember(workspaceId, data.user.id, roleId, "active");
      
      // Xoá/tiêu thụ lời mời
      await inviteRepo.deleteInvitation(workspaceId, invitation.email);
    }

    return { user: data.user, session: data.session };
  }
}
