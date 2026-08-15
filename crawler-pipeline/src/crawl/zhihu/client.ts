/**
 * # Client HTTP cho Zhihu để gửi request và xử lý session
 */

import { CONFIG } from "../../config.js";
import { ProxyAgent } from "undici";
import { getZhihuSign } from "../../sign/zhihu_sign.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { IApiClient, RequestOptions, CookieData } from "../../base/base_client.js";

export const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
let activeUserAgent = DEFAULT_USER_AGENT;

let dispatcher: ProxyAgent | undefined;
if (CONFIG.proxy) {
  dispatcher = new ProxyAgent(CONFIG.proxy);
}

let impitInstance: any = null;
const useImpit = process.env.DISABLE_IMPIT !== "true" && process.platform !== "win32";

/**
 * # Lấy instance impit để spoof JA3 và TLS
 */
async function getImpitInstance() {
  if (!useImpit) {
    return null;
  }
  if (impitInstance) {
    return impitInstance;
  }
  try {
    const { Impit } = await import("impit");
    impitInstance = new Impit({
      browser: "chrome",
      proxyUrl: CONFIG.proxy || undefined,
    });
    return impitInstance;
  } catch (err) {
    console.log("Không thể khởi tạo impit:", err);
    return null;
  }
}

/**
 * # Đọc cookie Zhihu từ môi trường hoặc tệp session
 */
export async function loadZhihuCookie(): Promise<string> {
  if (process.env.ZHIHU_COOKIE) {
    return process.env.ZHIHU_COOKIE;
  }
  try {
    const sessionPath = join(process.cwd(), "output", "zhihu_session.json");
    const content = await readFile(sessionPath, "utf8");
    const data = JSON.parse(content);
    return data.cookie || "";
  } catch {
    return "";
  }
}

/**
 * # Lưu cookie Zhihu vào tệp session
 */
export async function saveZhihuCookie(cookie: string): Promise<void> {
  const sessionPath = join(process.cwd(), "output", "zhihu_session.json");
  await mkdir(join(process.cwd(), "output"), { recursive: true });
  await writeFile(sessionPath, JSON.stringify({ cookie, updatedAt: new Date().toISOString() }, null, 2), "utf8");
}

/**
 * # Lấy tương đối URI từ một URL đầy đủ
 */
export function getRelativeUri(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (parsed.hostname === "api.zhihu.com" && path.startsWith("/search_v3")) {
      path = "/api/v4" + path;
    }
    return path + parsed.search;
  }
  return url;
}

/**
 * # Tải xuống file media (hình ảnh) và trả về Buffer
 */
export async function downloadMedia(url: string): Promise<Buffer> {
  const inst = await getImpitInstance();
  if (inst) {
    const response = await inst.fetch(url, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Không thể tải media qua impit từ ${url}, mã HTTP: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    const response = await fetch(url, {
      method: "GET",
      // @ts-ignore
      dispatcher
    });
    if (!response.ok) {
      throw new Error(`Không thể tải media từ ${url}, mã HTTP: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export class ZhihuClient implements IApiClient {
  private cookies: CookieData[] = [];
  private headers: Record<string, string> = {};

  constructor(options?: { proxy?: string; headers?: Record<string, string> }) {
    this.headers = {
      ...options?.headers,
    };
  }

  /**
   * # Thực hiện gửi yêu cầu HTTP thô đến Zhihu
   */
  async request(method: string, url: string, options?: RequestOptions): Promise<any> {
    let cookieStr = this.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    if (!cookieStr) {
      cookieStr = await loadZhihuCookie();
    }
    if (!cookieStr || !cookieStr.includes("d_c0")) {
      throw new Error("Không tìm thấy cookie 'd_c0' bắt buộc để thực hiện yêu cầu ký API Zhihu. Dừng crawl.");
    }

    const headers: Record<string, string> = {
      "User-Agent": activeUserAgent,
      "Accept": "*/*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Referer": options?.referer || "https://www.zhihu.com/",
      "Cookie": cookieStr,
      "x-api-version": "3.0.91",
      "x-app-za": "OS=Web",
      "x-requested-with": "fetch",
      "x-zse-93": "101_3_3.0",
      ...this.headers,
      ...options?.headers,
    };

    const finalUrl = url.startsWith("http") ? url : `https://www.zhihu.com${url}`;

    if (options?.sign !== false) {
      const relativeUri = getRelativeUri(finalUrl);
      const signRes = getZhihuSign(relativeUri, cookieStr);
      headers["x-zst-81"] = signRes["x-zst-81"];
      headers["x-zse-96"] = signRes["x-zse-96"];
    }

    const fetchOptions: any = {
      method: method || "GET",
      headers,
    };

    if (options?.body) {
      fetchOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    let responseText = "";
    const inst = await getImpitInstance();

    if (inst) {
      try {
        const response = await inst.fetch(finalUrl, fetchOptions);
        responseText = await response.text();
      } catch (err) {
        console.log("Lỗi impit:", err);
      }
    }

    if (!responseText) {
      try {
        const nativeOpts: any = {
          method: fetchOptions.method,
          headers: fetchOptions.headers,
        };
        if (fetchOptions.body) {
          nativeOpts.body = fetchOptions.body;
        }
        if (dispatcher) {
          nativeOpts.dispatcher = dispatcher;
        }
        const res = await fetch(finalUrl, nativeOpts);
        responseText = await res.text();
        if (res.status !== 200) {
          console.log(`[Zhihu Client] Native HTTP status: ${res.status} for URL: ${finalUrl}`);
          // Nếu status không phải 200 (ví dụ bị challenge unhuman), clear responseText để fallback nếu được phép
          responseText = "";
        }
      } catch (err) {
        console.log(`[Zhihu Client] Native fetch error: ${(err as Error).message}`);
      }
    }

    // Browser fallback block removed

    if (!responseText) {
      throw new Error(`Yêu cầu HTTP thất bại: không nhận được phản hồi từ Zhihu cho URL: ${finalUrl}`);
    }

    if (options?.headers?.["Accept"]?.includes("text/html") || !responseText.trim().startsWith("{")) {
      return responseText;
    }

    try {
      const data = JSON.parse(responseText);
      if (data.error) {
        throw new Error(`API Zhihu báo lỗi: ${data.error.message || JSON.stringify(data.error)}`);
      }
      return data;
    } catch (err) {
      throw new Error(`Lỗi parse JSON hoặc lỗi API: ${(err as Error).message}. Nội dung phản hồi: ${responseText.substring(0, 300)}`);
    }
  }

  setPage(page: any, context?: any): void {
    // No-op since browser mode is removed
  }

  async getCurrentUserInfo(): Promise<any> {
    return this.request("GET", "/api/v4/me?include=email,is_active,is_bind_phone");
  }

  async validateSession(): Promise<boolean> {
    try {
      const res = await this.getCurrentUserInfo();
      if (res && (res.uid || res.id) && res.name) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async pong(): Promise<boolean> {
    console.log("[ZhihuClient.pong] Bắt đầu pong zhihu...");
    try {
      const ok = await this.validateSession();
      if (ok) {
        console.log("[ZhihuClient.pong] Ping zhihu thành công.");
        return true;
      }
      console.log("[ZhihuClient.pong] Ping zhihu thất bại.");
      return false;
    } catch (err) {
      console.log("[ZhihuClient.pong] Lỗi khi ping zhihu:", (err as Error).message);
      return false;
    }
  }

  /**
   * # Cập nhật danh sách cookie cho client
   */
  async updateCookies(cookies: CookieData[]): Promise<void> {
    this.cookies = cookies;
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    await saveZhihuCookie(cookieStr);
  }

  /**
   * # Lấy danh sách cookie hiện tại của client
   */
  getActiveCookies(): CookieData[] {
    return this.cookies;
  }
}
