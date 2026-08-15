"use server";

/**
 * Server Actions — Authentication
 * Làm cầu nối gọi từ Client Components lên Auth Service.
 */
import { AuthService } from "@/lib/services/auth.service";
import { createClientServer } from "@/lib/supabase/server";

export async function loginAction(email: string, password: string, captchaToken?: string) {
  try {
    const result = await AuthService.login(email, password, captchaToken);
    return { success: true, user: result.user };
  } catch (err) {
    return { success: false, error: (err as Error).message || "Đăng nhập thất bại." };
  }
}

export async function signUpAction(email: string, password: string, inviteToken?: string, captchaToken?: string) {
  try {
    const result = await AuthService.signUp(email, password, inviteToken, captchaToken);
    return { success: true, user: result.user, hasSession: !!result.session };
  } catch (err) {
    return { success: false, error: (err as Error).message || "Đăng ký thất bại." };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createClientServer();
    await supabase.auth.signOut();
  } catch {
    // 
  }
}
