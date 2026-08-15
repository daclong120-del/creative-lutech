import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

/**
 * Khởi tạo Supabase Client chạy ở môi trường Server (Server Components, Route Handlers, Server Actions)
 * Đọc/ghi session trực tiếp thông qua Next.js cookies store.
 */
export async function createClientServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Có thể bỏ qua lỗi này nếu hàm setAll được gọi bên trong một Server Component.
            // Middleware sẽ chịu trách nhiệm chính trong việc cập nhật cookie.
          }
        },
      },
    }
  );
}

/**
 * Supabase Client chạy với service_role key — bypass RLS.
 * CHỈ dùng cho admin operations (delete, bulk update) đã qua requireAdmin() guard.
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}
