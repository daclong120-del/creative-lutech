import { headers } from "next/headers";

/**
 * Xác thực Origin/Referer headers để phòng chống tấn công CSRF (Cross-Site Request Forgery)
 * khi cấu hình SameSite=Lax cho Auth Cookie.
 * Chỉ áp dụng cho các Next.js Route Handlers nhận mutation request (POST, PUT, DELETE, PATCH).
 * 
 * @returns {Promise<boolean>} true nếu request hợp lệ, false nếu có dấu hiệu tấn công CSRF
 */
export async function verifyCSRF(): Promise<boolean> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const host = headersList.get("host") || headersList.get("x-forwarded-host");

  // Whitelist tĩnh từ biến môi trường và dev local / Vercel preview
  const allowedOrigins = new Set<string>([
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
    "http://localhost:3000",
  ].filter(Boolean) as string[]);

  if (host) {
    allowedOrigins.add(`http://${host}`);
    allowedOrigins.add(`https://${host}`);
  }

  // 1. Kiểm tra Origin header (được trình duyệt kiểm soát chặt chẽ)
  if (origin) {
    if (allowedOrigins.has(origin)) return true;
    try {
      const originUrl = new URL(origin);
      if (host && (originUrl.host === host || originUrl.host.endsWith(".vercel.app"))) {
        return true;
      }
    } catch {}
    return false;
  }

  // 2. Fallback kiểm tra Referer header (nếu thiếu Origin)
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (allowedOrigins.has(refererUrl.origin)) return true;
      if (host && (refererUrl.host === host || refererUrl.host.endsWith(".vercel.app"))) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
