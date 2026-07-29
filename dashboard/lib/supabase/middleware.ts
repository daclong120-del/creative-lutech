import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh session và đồng bộ cookies trong Next.js Middleware
 * Trả về response chứa cookie mới và thông tin user hiện tại (nếu có).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Cập nhật cookies trên request headers
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          
          // Tạo response mới chứa request headers đã cập nhật
          supabaseResponse = NextResponse.next({
            request,
          });
          
          // Đặt cookies mới trên response để trình duyệt lưu lại
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;

  // Bypass authentication in development using mock user cookie
  if (process.env.NODE_ENV === "development") {
    const devUser = request.cookies.get("sinomedia_dev_user")?.value;
    if (devUser) {
      user = {
        id: devUser.includes("admin") ? "dev-admin-id" : "dev-user-id",
        email: devUser,
        role: "authenticated",
      } as any;
    }
  }

  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!user && hasAuthCookie) {
    try {
      // Thiết lập timeout 2 giây để tránh treo request khi Supabase local offline
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase auth connection timeout")), 2000)
      );
      
      const getUserPromise = supabase.auth.getUser()
        .then(({ data }) => data?.user || null)
        .catch(() => null);
      
      user = await Promise.race([getUserPromise, timeoutPromise]);
    } catch (err) {
      console.warn("[Middleware] Supabase getUser failed or timed out:", err);
    }
  }

  return { supabaseResponse, user, supabase };

}
