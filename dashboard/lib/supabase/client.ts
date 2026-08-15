import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

/**
 * Khởi tạo Supabase Client chạy ở môi trường Client (Browser)
 * Tự động đồng bộ và quản lý session qua cookies.
 */
export function createClientBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
