import { NextRequest } from "next/server";
import dns from "node:dns";
import { getCurrentUser } from "@/lib/supabase/auth-helper";

dns.setDefaultResultOrder("ipv4first");

export const dynamic = "force-dynamic";

const ALLOWED_DOMAINS = [
  // Bilibili
  "bilibili.com", "hdslb.com", "bilivideo.com", "bilivideo.cn", "bilivideo.com.cn",
  // Douyin
  "douyin.com", "snssdk.com", "amemv.com", "iesdouyin.com", "pstatp.com", "byteimg.com", "volces.com",
  // Kuaishou
  "kuaishou.com", "yximgs.com", "gifshow.com", "kspkg.com",
  // Xiaohongshu
  "xiaohongshu.com", "xhscdn.com"
];

function isPrivateIp(ip: string): boolean {
  // IPv4 check
  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    const [p1, p2, p3, p4] = parts;
    if (Number.isNaN(p1) || Number.isNaN(p2) || Number.isNaN(p3) || Number.isNaN(p4)) return true;
    // 127.0.0.0/8 (Loopback)
    if (p1 === 127) return true;
    // 10.0.0.0/8 (Private)
    if (p1 === 10) return true;
    // 172.16.0.0/12 (Private)
    if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (p1 === 192 && p2 === 168) return true;
    // 169.254.0.0/16 (Link-local)
    if (p1 === 169 && p2 === 254) return true;
    // 0.0.0.0 (Unspecified)
    if (p1 === 0) return true;
    return false;
  }
  // IPv6 check
  if (ip.includes(":")) {
    const lowerIp = ip.toLowerCase();
    // Loopback ::1
    if (lowerIp === "::1" || lowerIp === "0:0:0:0:0:0:0:1") return true;
    // Link-local fe80::/10
    if (lowerIp.startsWith("fe8") || lowerIp.startsWith("fe9") || lowerIp.startsWith("fea") || lowerIp.startsWith("feb")) return true;
    // Unique Local fc00::/7
    if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  // 1. Kiểm tra session đăng nhập (Fail-closed)
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Khởi tạo headers cho request tới video CDN
  const headers = new Headers();
  
  // Set User-Agent giả lập trình duyệt
  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Set Referer & Origin tương ứng với từng nền tảng để tránh lỗi 403 Forbidden
  const lowerUrl = targetUrl.toLowerCase();
  if (
    lowerUrl.includes("bilibili") ||
    lowerUrl.includes("hdslb") ||
    lowerUrl.includes("bilivideo")
  ) {
    headers.set("Referer", "https://www.bilibili.com/");
    headers.set("Origin", "https://www.bilibili.com");
  } else if (
    lowerUrl.includes("douyin") ||
    lowerUrl.includes("snssdk") ||
    lowerUrl.includes("amemv") ||
    lowerUrl.includes("iesdouyin")
  ) {
    headers.set("Referer", "https://www.douyin.com/");
    headers.set("Origin", "https://www.douyin.com");
  } else if (
    lowerUrl.includes("kuaishou") ||
    lowerUrl.includes("yximgs") ||
    lowerUrl.includes("gifshow")
  ) {
    headers.set("Referer", "https://www.kuaishou.com/");
    headers.set("Origin", "https://www.kuaishou.com");
  } else if (lowerUrl.includes("xiaohongshu") || lowerUrl.includes("xhscdn")) {
    headers.set("Referer", "https://www.xiaohongshu.com/");
    headers.set("Origin", "https://www.xiaohongshu.com");
  }

  // Chuyển tiếp header Range từ browser để hỗ trợ seeking/tua video
  const clientRange = req.headers.get("range");
  if (clientRange) {
    // Validate Range format
    const rangeRegex = /^bytes=(\d+)-(\d*)$/;
    if (!rangeRegex.test(clientRange)) {
      return new Response("Invalid Range header format", { status: 400 });
    }
    headers.set("Range", clientRange);
  }

  // Thêm Timeout (10 giây) để tránh treo Server resources
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let currentUrl = targetUrl;
    let res: Response;
    let redirectsCount = 0;
    const MAX_REDIRECTS = 3;

    while (true) {
      // 2. Validate URL format & protocol (chỉ cho phép HTTPS)
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(currentUrl);
      } catch {
        clearTimeout(timeoutId);
        return new Response("Invalid URL format", { status: 400 });
      }

      if (parsedUrl.protocol !== "https:") {
        clearTimeout(timeoutId);
        return new Response("Only HTTPS protocol is supported", { status: 400 });
      }

      // 3. Domain Allowlist Check
      const hostname = parsedUrl.hostname.toLowerCase();
      const isAllowedDomain = ALLOWED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith("." + domain)
      );

      if (!isAllowedDomain) {
        clearTimeout(timeoutId);
        return new Response("Forbidden domain target", { status: 403 });
      }

      // 4. DNS Resolution & Private/Local IP Filtering (SSRF Prevention)
      try {
        const dnsPromises = dns.promises;
        const lookupResults = await dnsPromises.lookup(hostname, { all: true });
        for (const addr of lookupResults) {
          if (isPrivateIp(addr.address)) {
            clearTimeout(timeoutId);
            return new Response("Access to private or local networks is forbidden", { status: 403 });
          }
        }
      } catch (dnsErr) {
        console.error(`[VideoProxy] DNS lookup failed for ${hostname}:`, dnsErr);
        clearTimeout(timeoutId);
        return new Response("DNS resolution failed for target", { status: 400 });
      }

      // Fetch target media (redirect: manual)
      res = await fetch(currentUrl, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
        redirect: "manual"
      });

      // Xử lý redirects thủ công để validate URL mới chống SSRF
      if ([301, 302, 307, 308].includes(res.status)) {
        redirectsCount++;
        if (redirectsCount > MAX_REDIRECTS) {
          clearTimeout(timeoutId);
          return new Response("Too many redirects", { status: 508 });
        }
        const location = res.headers.get("location");
        if (!location) {
          clearTimeout(timeoutId);
          return new Response("Redirect location missing", { status: 502 });
        }
        // Tạo URL tuyệt đối từ Location header
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      break;
    }

    clearTimeout(timeoutId);

    // Nếu HTTP status không phải thành công hoặc 206 (Partial Content), trả lỗi
    if (!res.ok && res.status !== 206) {
      const isProd = process.env.NODE_ENV === "production";
      const errorMsg = isProd 
        ? "Failed to fetch media from target" 
        : `Failed to fetch media from target: ${res.status} ${res.statusText}`;
      return new Response(errorMsg, {
        status: res.status,
      });
    }

    // 5. Content-Type Allowlist Check
    const contentType = res.headers.get("content-type")?.toLowerCase() || "";
    const isAllowedType = contentType.startsWith("video/") || 
                          contentType.startsWith("image/") || 
                          contentType.startsWith("audio/") || 
                          contentType === "application/octet-stream";
    if (!isAllowedType) {
      return new Response(`Forbidden content type: ${contentType}`, { status: 415 });
    }

    // 6. File Size Limit Check (Tối đa 100MB)
    const contentLengthStr = res.headers.get("content-length");
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10);
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      if (contentLength > MAX_SIZE) {
        return new Response("File size exceeds limit (100MB)", { status: 413 });
      }
    }

    // Sao chép các headers liên quan của video stream
    const responseHeaders = new Headers();
    const headersToCopy = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];

    for (const h of headersToCopy) {
      const val = res.headers.get(h);
      if (val) {
        responseHeaders.set(h, val);
      }
    }

    // 7. Dynamic CORS Configuration (Tránh Access-Control-Allow-Origin: *)
    const requestOrigin = req.headers.get("origin");
    if (requestOrigin) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      let allowed = false;
      if (siteUrl) {
        try {
          allowed = new URL(requestOrigin).origin === new URL(siteUrl).origin;
        } catch {
          allowed = false;
        }
      }
      if (!allowed) {
        const devOrigins = [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3001"
        ];
        if (devOrigins.includes(requestOrigin)) {
          allowed = true;
        }
      }
      if (allowed) {
        responseHeaders.set("Access-Control-Allow-Origin", requestOrigin);
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
      }
    }
    responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Range");

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[VideoProxy] Error streaming video:", error);
    const err = error as Error & { name?: string; cause?: { message?: string; errors?: Array<{ code: string; message: string }> } | null | undefined };
    if (err.name === "AbortError") {
      return new Response("Target request timed out", { status: 504 });
    }
    let causeMsg = err.cause ? (err.cause.message || String(err.cause)) : "No cause";
    if (err.cause && Array.isArray(err.cause.errors)) {
      causeMsg += " [ " + err.cause.errors.map(e => `${e.code || "unknown"}: ${e.message || "unknown"}`).join(", ") + " ]";
    }
    const isProd = process.env.NODE_ENV === "production";
    const body = isProd 
      ? "Internal Server Error"
      : `Internal Server Error: ${err.message}\nCause: ${causeMsg}\n${err.stack || "No stack"}`;
    return new Response(body, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  const headers = new Headers();
  const requestOrigin = req.headers.get("origin");
  if (requestOrigin) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    let allowed = false;
    if (siteUrl) {
      try {
        allowed = new URL(requestOrigin).origin === new URL(siteUrl).origin;
      } catch {
        allowed = false;
      }
    }
    if (!allowed) {
      const devOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
      ];
      if (devOrigins.includes(requestOrigin)) {
        allowed = true;
      }
    }
    if (allowed) {
      headers.set("Access-Control-Allow-Origin", requestOrigin);
      headers.set("Access-Control-Allow-Credentials", "true");
    }
  }
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Range");
  return new Response(null, { status: 204, headers });
}
