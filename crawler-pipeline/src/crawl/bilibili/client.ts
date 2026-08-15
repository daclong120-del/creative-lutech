/**
 * # Client HTTP cho Bilibili để gửi request và xử lý session
 */

import { CONFIG } from "../../config.js";
import { ProxyAgent } from "undici";
import { getWbiSign } from "../../sign/bilibili_sign.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
let activeUserAgent = DEFAULT_USER_AGENT;

let wbiImgKey = "";
let wbiSubKey = "";
let wbiKeysFetchedAt = 0;
const WBI_CACHE_TTL = 3600000;

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

let tempCookieOverride = "";

/**
 * # Ghi đè cookie Bilibili tạm thời từ pool tài khoản
 */
export function setBilibiliCookie(cookie: string): void {
  tempCookieOverride = cookie;
}

function formatCookie(cookieStr: string): string {
  if (!cookieStr) return "";
  let trimmed = cookieStr.trim();
  // Nếu chuỗi bị bọc ngoài bởi dấu nháy kép (ví dụ: "...") do lưu trữ hoặc parse lỗi
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
        return arr
          .map((c: any) => {
            const name = c.name || c.key || "";
            const value = c.value || "";
            return name && value ? `${name}=${value}` : "";
          })
          .filter(Boolean)
          .join("; ");
      }
    } catch {}
  }
  // Nếu là JSON object
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const obj = JSON.parse(trimmed);
      return Object.entries(obj)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    } catch {}
  }
  return trimmed;
}

/**
 * # Đọc cookie Bilibili từ bộ nhớ tạm, môi trường hoặc tệp session
 */
export async function loadBilibiliCookie(): Promise<string> {
  let cookie = "";
  if (tempCookieOverride) {
    cookie = tempCookieOverride;
  } else if (process.env.BILIBILI_COOKIE) {
    cookie = process.env.BILIBILI_COOKIE;
  } else {
    try {
      const sessionPath = join(process.cwd(), "output", "bilibili_session.json");
      const content = await readFile(sessionPath, "utf8");
      const data = JSON.parse(content);
      cookie = data.cookie || "";
    } catch {
      cookie = "";
    }
  }
  return formatCookie(cookie);
}

/**
 * # Lưu cookie Bilibili vào tệp session
 */
export async function saveBilibiliCookie(cookie: string): Promise<void> {
  const sessionPath = join(process.cwd(), "output", "bilibili_session.json");
  await mkdir(join(process.cwd(), "output"), { recursive: true });
  await writeFile(sessionPath, JSON.stringify({ cookie, updatedAt: new Date().toISOString() }, null, 2), "utf8");
}

// browserContext, browserPage, getBrowserPage, getBrowserContext and closeBrowser removed

/**
 * # Gửi request HTTP thô lên API Bilibili và trả về JSON data
 */
export async function bilibiliRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<any> {
  const cookieStr = await loadBilibiliCookie();
  const headers = {
    "User-Agent": activeUserAgent,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://www.bilibili.com/",
    "Cookie": cookieStr,
    ...options.headers,
  };

  const fetchOptions: any = {
    method: options.method || "GET",
    headers,
    signal: AbortSignal.timeout(30000), // Timeout 30 giây
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  let responseText = "";
  const inst = await getImpitInstance();
  if (inst) {
    try {
      const response = await inst.fetch(url, fetchOptions);
      responseText = await response.text();
    } catch (err) {
      console.log(`Lỗi impit khi gửi request: ${(err as Error).message}`);
    }
  } else {
    try {
      const nativeOpts: any = {
        method: fetchOptions.method,
        headers: fetchOptions.headers,
        signal: fetchOptions.signal,
      };
      if (fetchOptions.body) {
        nativeOpts.body = fetchOptions.body;
      }
      if (dispatcher) {
        nativeOpts.dispatcher = dispatcher;
      }
      const res = await fetch(url, nativeOpts);
      responseText = await res.text();
    } catch (err) {
      console.log(`Lỗi native fetch khi gửi request: ${(err as Error).message}`);
    }
  }

  if (!responseText) {
    throw new Error(`Không nhận được phản hồi HTTP từ URL: ${url}`);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`Không thể giải mã JSON từ phản hồi HTTP. Nội dung: ${responseText.substring(0, 300)}`);
  }

  if (data.code !== undefined && data.code !== 0) {
    throw new Error(`API Bilibili trả về mã lỗi ${data.code}: ${data.message || "Không rõ nguyên nhân"}`);
  }

  return data.data ?? data;
}

/**
 * # Kiểm tra trạng thái đăng nhập Bilibili
 */
export async function pong(): Promise<boolean> {
  console.log("Đang kiểm tra trạng thái đăng nhập Bilibili...");
  try {
    const resp = await bilibiliRequest("https://api.bilibili.com/x/web-interface/nav", {
      headers: {
        "Referer": "https://www.bilibili.com/"
      }
    });
    if (resp && resp.isLogin === true) {
      console.log("Trạng thái đăng nhập Bilibili: Hoạt động (isLogin: true)");
      return true;
    }
    console.log("Trạng thái đăng nhập Bilibili: Không xác định hoặc chưa đăng nhập");
    return false;
  } catch (err) {
    console.log(`Kiểm tra trạng thái đăng nhập thất bại hoặc bị chặn: ${(err as Error).message}`);
    return false;
  }
}

/**
 * # Lấy img_key và sub_key từ Bilibili API để phục vụ ký WBI
 */
async function fetchWbiKeys(): Promise<{ imgKey: string; subKey: string }> {
  // browserPage check removed, calling API directly

  const resp = await bilibiliRequest("https://api.bilibili.com/x/web-interface/nav", {
    headers: {
      "Referer": "https://www.bilibili.com/"
    }
  });

  const wbiImg = resp.wbi_img;
  if (!wbiImg || !wbiImg.img_url || !wbiImg.sub_url) {
    throw new Error("Không thể lấy thông tin wbi_img từ nav API");
  }

  const imgUrl = wbiImg.img_url;
  const subUrl = wbiImg.sub_url;

  const imgKey = imgUrl.substring(imgUrl.lastIndexOf("/") + 1).split(".")[0];
  const subKey = subUrl.substring(subUrl.lastIndexOf("/") + 1).split(".")[0];

  return { imgKey, subKey };
}

/**
 * # Thực hiện gửi request GET đến API Bilibili và tự động ký WBI
 */
export async function bilibiliGet(
  uri: string,
  extraParams: Record<string, any> = {},
  enableParamsSign = true
): Promise<any> {
  let params = { ...extraParams };

  if (enableParamsSign) {
    const now = Date.now();
    if (!wbiImgKey || !wbiSubKey || now - wbiKeysFetchedAt > WBI_CACHE_TTL) {
      const keys = await fetchWbiKeys();
      wbiImgKey = keys.imgKey;
      wbiSubKey = keys.subKey;
      wbiKeysFetchedAt = now;
    }
    params = getWbiSign(params, wbiImgKey, wbiSubKey);
  }

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const finalUrl = queryString ? `https://api.bilibili.com${uri}?${queryString}` : `https://api.bilibili.com${uri}`;

  return bilibiliRequest(finalUrl);
}

/**
 * # Tải xuống file media (video/audio) và trả về Buffer
 */
export async function downloadMedia(url: string): Promise<Buffer> {
  const headers = {
    "User-Agent": activeUserAgent,
    "Referer": "https://www.bilibili.com/",
  };

  const inst = await getImpitInstance();
  if (inst) {
    const response = await inst.fetch(url, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error(`Không thể tải media qua impit từ ${url}, mã HTTP: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    const fetchOpts: any = {
      method: "GET",
      headers,
    };
    if (dispatcher) {
      fetchOpts.dispatcher = dispatcher;
    }
    const response = await fetch(url, fetchOpts);
    if (!response.ok) {
      throw new Error(`Không thể tải media từ ${url}, mã HTTP: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
