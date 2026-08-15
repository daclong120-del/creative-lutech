/**
 * # Module chia sẻ duy nhất để giao tiếp với Supabase PostgREST API
 * Hợp nhất 3 bản copy supabaseRest() trước đây (queue_worker, account_pool, supabase_writer)
 * để tránh lệch logic và dễ bảo trì.
 */

import { CONFIG } from "../config.js";
import { ProxyAgent } from "undici";

let dispatcher: ProxyAgent | undefined;
if (CONFIG.proxy) {
  dispatcher = new ProxyAgent(CONFIG.proxy);
}

/**
 * # Gửi HTTP request đến Supabase PostgREST API dùng service_role key
 * Hỗ trợ: proxy (undici), custom headers, 204 No Content handling, Prefer header cho mutating ops.
 */
export async function supabaseRest(
  path: string,
  options: {
    method?: string;
    body?: any;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): Promise<any> {
  const urlObj = new URL(`${CONFIG.supabase.url}/rest/v1/${path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      urlObj.searchParams.append(key, value);
    }
  }

  const headers: Record<string, string> = {
    "x-api-key": CONFIG.supabase.apiToken,
    "Authorization": `Bearer ${CONFIG.supabase.apiToken}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Tự động thêm Prefer header cho các thao tác ghi (POST/PUT/PATCH)
  if (
    options.method &&
    ["POST", "PUT", "PATCH"].includes(options.method) &&
    !options.headers?.["Prefer"]
  ) {
    headers["Prefer"] = "return=representation,resolution=merge-duplicates";
  }

  const fetchOptions: any = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  if (dispatcher) {
    fetchOptions.dispatcher = dispatcher;
  }

  const res = await fetch(urlObj.toString(), fetchOptions);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${errText}`);
  }

  // Xử lý response body rỗng (PATCH/DELETE thường trả về 204, POST với return=minimal trả về 201 không có body)
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}
