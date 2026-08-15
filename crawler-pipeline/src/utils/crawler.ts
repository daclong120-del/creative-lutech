/**
 * # Tiện ích dùng chung cho crawler — retry, user-agent, URL parsing, cookies
 */

/**
 * # Retry một hàm async tối đa maxRetries lần với delay giữa các lần
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const waitMs = delayMs * Math.pow(backoffMultiplier, attempt);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }
  throw lastError;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/**
 * # Lấy ngẫu nhiên một User-Agent từ danh sách
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * # Trích xuất domain từ URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/**
 * # Chuyển object params thành query string
 */
export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * # Chuyển cookie string "k1=v1; k2=v2" thành object { k1: "v1", k2: "v2" }
 * Ánh xạ từ ChinaMediaCrawler tools/crawler_util.py convert_str_cookie_to_dict
 */
export function parseCookieString(cookieStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieStr) return result;

  let trimmed = cookieStr.trim();

  // Giải nháy kép nếu có (ví dụ chuỗi JSON bị bọc nháy kép do lưu trữ)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const unescaped = JSON.parse(trimmed);
      if (typeof unescaped === "string") {
        trimmed = unescaped.trim();
      }
    } catch {}
  }

  // Nếu là JSON array (ví dụ Chrome Cookies export)
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        for (const c of arr) {
          const name = c.name || c.key;
          const value = c.value !== undefined ? c.value : "";
          if (name) {
            result[name] = String(value);
          }
        }
        return result;
      }
    } catch {}
  }

  // Nếu là JSON object
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        // Hỗ trợ obj.cookie (dạng string)
        if (typeof obj.cookie === "string" && obj.cookie.trim()) {
          return parseCookieString(obj.cookie);
        }

        // Hỗ trợ obj.cookies (dạng mảng) - Ví dụ: Douyin session hoặc các cấu trúc tương tự
        if (Array.isArray(obj.cookies)) {
          for (const c of obj.cookies) {
            const name = c.name || c.key;
            const value = c.value !== undefined ? c.value : "";
            if (name) {
              result[name] = String(value);
            }
          }
          // Thêm msToken nếu có
          if (obj.msToken !== undefined) {
            result["msToken"] = String(obj.msToken);
          }
          return result;
        }

        // Chỉ coi là cookie map khi toàn bộ values trong object là primitive (string, number, boolean)
        const hasNonPrimitive = Object.values(obj).some(
          v => v !== null && typeof v === "object"
        );

        if (!hasNonPrimitive) {
          for (const [k, v] of Object.entries(obj)) {
            result[k] = String(v);
          }
          return result;
        }
      }
    } catch {}
  }

  // Phân tách cookie string truyền thống dạng "k1=v1; k2=v2"
  for (const part of trimmed.split(";")) {
    const partTrimmed = part.trim();
    if (!partTrimmed) continue;
    const eqIndex = partTrimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = partTrimmed.slice(0, eqIndex).trim();
    const value = partTrimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * # Chuyển mảng cookie objects [{name, value}] thành cookie string
 * Ánh xạ từ ChinaMediaCrawler tools/crawler_util.py convert_cookies
 */
export function formatCookies(cookies: Array<{ name: string; value: string }>): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * # Loại bỏ HTML tags, trả về text thuần
 * Ánh xạ từ ChinaMediaCrawler tools/crawler_util.py extract_text_from_html
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * # Trích xuất URL params thành object
 * Ánh xạ từ ChinaMediaCrawler tools/crawler_util.py extract_url_params_to_dict
 */
export function extractUrlParams(url: string): Record<string, string> {
  try {
    const params: Record<string, string> = {};
    new URL(url).searchParams.forEach((v, k) => { params[k] = v; });
    return params;
  } catch {
    return {};
  }
}

/**
 * # Parse chuỗi tương tác "1.2万" / "3.5w" / "1234" thành số nguyên
 * Ánh xạ từ ChinaMediaCrawler tools/crawler_util.py match_interact_info_count
 */
export function matchInteractCount(countStr: string): number {
  if (!countStr) return 0;
  const cleaned = countStr.trim().replace(/,/g, "");
  const wanMatch = cleaned.match(/([\d.]+)\s*[万wW]/);
  if (wanMatch) return Math.round(parseFloat(wanMatch[1]) * 10000);
  const yiMatch = cleaned.match(/([\d.]+)\s*[亿]/);
  if (yiMatch) return Math.round(parseFloat(yiMatch[1]) * 100000000);
  const numMatch = cleaned.match(/\d+/);
  return numMatch ? parseInt(numMatch[0], 10) : 0;
}

