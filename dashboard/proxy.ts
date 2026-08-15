import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Route bảo mật (Yêu cầu đăng nhập)
  const isDashboardRoute = path.startsWith("/dash");
  // Route quản lý thành viên, tài khoản, tác vụ (Yêu cầu admin)
  const ADMIN_ONLY_PREFIXES = [
    "/dash/manage-account/members",
    "/dash/accounts",
    "/dash/tasks",
    "/dash/proxies",
    "/dash/audit-logs",
    "/dash/settings",
    "/dash/data/management",
  ];

  const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  // Route xác thực (Chỉ cho phép khi chưa đăng nhập)
  const isAuthRoute = path === "/login" || path === "/sign-up" || path === "/forgot-password";

  if (isDashboardRoute) {
    if (!user) {
      // Lưu lại URL hiện tại để chuyển hướng sau khi đăng nhập thành công
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirect_uri", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminOnlyRoute) {
      let isAdmin = false;
      
      if (user.id === "dev-admin-id") {
        isAdmin = true;
      } else if (supabase) {
        const { data: member } = await supabase
          .from("team_members")
          .select("role_id")
          .eq("user_id", user.id)
          .single();
        isAdmin = member?.role_id === "admin";
      }

      if (!isAdmin) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dash/home";
        redirectUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(redirectUrl);
      }
    }

  }

  if (isAuthRoute) {
    if (user) {
      // Đã đăng nhập, không cho vào trang login nữa mà đẩy về dashboard
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dash/home";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

// Export thêm alias middleware để tương thích nếu cần
export { proxy as middleware };

// Chỉ chạy proxy trên các dashboard routes và auth pages
export const config = {
  matcher: [
    "/dash/:path*",
    "/login",
    "/sign-up",
    "/forgot-password",
  ],
};
