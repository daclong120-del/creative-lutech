import { NextRequest, NextResponse } from "next/server";
import { verifyApiToken } from "@/lib/guards/token.guard";
import { encrypt, decrypt } from "@/lib/utils/crypto";

const ALLOWED_COLUMNS: Record<string, string[]> = {
  crawler_tasks: [
    "id", "platform", "command", "target", "max_count", "status", "priority", 
    "scheduled_at", "created_at", "updated_at", "error_message", "metadata"
  ],
  crawler_accounts: [
    "id", "platform", "username", "cookie_data", "status", "failure_count", "last_used_at", "created_at", "updated_at"
  ],
  crawled_posts: [
    "id", "platform", "author_id", "platform_id", "caption", "cover_url", "media_urls", 
    "stats", "raw", "published_at", "crawled_at", "media_type", "original_media_urls", 
    "original_cover_url", "media_status", "media_source", "media_error", "media_cached_at",
    "title", "content_type", "source_url"
  ],
  crawled_authors: [
    "id", "platform_uid", "nickname", "platform", "gender", "description", 
    "fans_count", "follows_count", "ip_location", "avatar_url", "created_at", "updated_at", 
    "raw", "videos_count", "interaction_count"
  ],
  crawled_comments: [
    "id", "platform", "platform_cid", "post_id", "platform_post_id", "parent_cid", 
    "author_uid", "author_nickname", "content", "like_count", "raw", "published_at", "crawled_at"
  ],
  post_metric_snapshots: [
    "id", "post_id", "platform", "platform_post_id", "observed_at", "view_count", 
    "like_count", "comment_count", "share_count", "raw", "source"
  ],
  author_metric_snapshots: [
    "id", "author_id", "platform", "platform_author_id", "observed_at", "fans_count", 
    "follows_count", "interaction_count", "videos_count", "raw", "source"
  ],
  crawler_logs: [
    "id", "task_id", "level", "message", "created_at"
  ]
};

const PATCH_WHITELISTS: Record<string, string[]> = {
  crawler_tasks: ["status", "error_message", "updated_at", "metadata"],
  crawler_accounts: ["last_used_at", "failure_count", "status", "updated_at"],
  crawled_posts: ["stats", "updated_at"],
  crawled_authors: ["fans_count", "follows_count", "updated_at"]
};

const POST_WHITELISTS: Record<string, string[]> = {
  crawler_accounts: ["platform", "username", "cookie_data", "status", "failure_count", "last_used_at", "updated_at"],
  crawler_logs: ["task_id", "level", "message", "created_at"],
  crawled_posts: [
    "id", "platform", "platform_id", "author_id", "caption", "media_urls", "cover_url", 
    "stats", "raw", "crawled_at", "published_at", "tags", "language", "media_type", 
    "original_media_urls", "original_cover_url", "media_status", "media_source", 
    "media_error", "media_cached_at", "title", "content_type", "source_url"
  ],
  crawled_authors: [
    "id", "platform", "platform_uid", "nickname", "avatar_url", "gender", "description", 
    "follows_count", "fans_count", "interaction_count", "videos_count", "ip_location", 
    "raw", "updated_at"
  ],
  crawled_comments: [
    "platform", "platform_cid", "post_id", "platform_post_id", "parent_cid", 
    "author_uid", "author_nickname", "content", "like_count", "raw", "published_at", "crawled_at"
  ],
  post_metric_snapshots: [
    "post_id", "platform", "platform_post_id", "view_count", "like_count", "comment_count", 
    "share_count", "raw", "source", "observed_at"
  ],
  author_metric_snapshots: [
    "author_id", "platform", "platform_author_id", "fans_count", "follows_count", 
    "interaction_count", "videos_count", "raw", "source", "observed_at"
  ]
};

function determineRequiredScopes(pathArray: string[], method: string): string[] | null {
  const pathStr = pathArray.join("/");
  
  if (method === "POST" && pathStr === "rpc/claim_next_crawler_task") return ["crawler:claim"];
  if (method === "POST" && pathStr === "crawler_logs") return ["crawler:write_logs"];
  
  // Tasks
  if (method === "GET" && pathStr === "crawler_tasks") return ["crawler:read_task"];
  if (method === "PATCH" && pathStr === "crawler_tasks") return ["crawler:update_task"];
  
  // Accounts
  if (method === "GET" && pathStr === "crawler_accounts") return ["crawler:read_accounts"];
  if (method === "PATCH" && pathStr === "crawler_accounts") return ["crawler:update_accounts"];
  if (method === "POST" && pathStr === "crawler_accounts") return ["crawler:write_accounts"];
  
  // Data ingestion
  if (method === "GET" && pathStr === "crawled_posts") return ["crawler:read_data"];
  if (method === "POST" && pathStr === "crawled_posts") return ["crawler:write_data"];
  if (method === "PATCH" && pathStr === "crawled_posts") return ["crawler:update_data"];
  
  if (method === "GET" && pathStr === "crawled_authors") return ["crawler:read_data"];
  if (method === "POST" && pathStr === "crawled_authors") return ["crawler:write_data"];
  if (method === "PATCH" && pathStr === "crawled_authors") return ["crawler:update_data"];
  
  if (method === "POST" && pathStr === "crawled_comments") return ["crawler:write_data"];
  
  // Metrics snapshots
  if (method === "POST" && pathStr === "post_metric_snapshots") return ["crawler:write_data"];
  if (method === "POST" && pathStr === "author_metric_snapshots") return ["crawler:write_data"];

  // Deny anything else
  return null;
}

function validatePayload(payload: unknown, whitelist: string[]): boolean {
  if (!payload || typeof payload !== "object") return true;
  if (Array.isArray(payload)) {
    return payload.every(item => validatePayload(item, whitelist));
  }
  const keys = Object.keys(payload);
  return keys.every(key => whitelist.includes(key));
}

interface CrawlerAccountValidationResult {
  error: string | null;
  forcedSelect?: string;
  forcedParams?: Record<string, string>;
}

function validateCrawlerAccountGet(searchParams: URLSearchParams): CrawlerAccountValidationResult {
  const keys = Array.from(searchParams.keys());
  
  // Mode 2: Read account status by id
  if (keys.includes("id")) {
    const invalidKeys = keys.filter(k => k !== "id" && k !== "select" && k !== "apikey");
    if (invalidKeys.length > 0) {
      return { error: "Mode 2 (Read Status) only allows query by 'id'" };
    }
    
    const idVal = searchParams.get("id");
    if (!idVal || !idVal.startsWith("eq.")) {
      return { error: "Invalid id filter. Expected eq.<uuid>" };
    }
    
    const selectParam = searchParams.get("select");
    if (selectParam) {
      if (selectParam.includes("cookie_data") || selectParam.includes("*")) {
        return { error: "cookie_data and wildcard (*) are not allowed in status check mode" };
      }
    }
    
    return {
      error: null,
      forcedSelect: "id,status,failure_count",
      forcedParams: { limit: "1" }
    };
  }
  
  // Mode 1: Checkout account
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const order = searchParams.get("order");
  const limit = searchParams.get("limit");
  
  if (!platform || !platform.startsWith("eq.")) {
    return { error: "Missing or invalid platform filter" };
  }
  
  if (status !== "eq.active") {
    return { error: "Query must contain status=eq.active" };
  }
  
  if (order !== "last_used_at.asc.nullsfirst") {
    return { error: "Query must contain order=last_used_at.asc.nullsfirst" };
  }
  
  if (limit !== "1") {
    return { error: "Query limit must be exactly 1" };
  }
  
  const allowedKeys = ["platform", "status", "order", "limit", "select", "apikey"];
  const extraKeys = keys.filter(k => !allowedKeys.includes(k));
  if (extraKeys.length > 0) {
    return { error: `Disallowed query parameters in checkout mode: ${extraKeys.join(", ")}` };
  }
  
  const selectParam = searchParams.get("select");
  if (selectParam) {
    if (selectParam.includes("*")) {
      return { error: "Wildcard select (*) is not allowed" };
    }
    const cols = selectParam.split(",").map(c => c.trim());
    const checkoutAllowed = ["id", "username", "cookie_data"];
    for (const col of cols) {
      if (!checkoutAllowed.includes(col)) {
        return { error: `Disallowed column in checkout select: ${col}` };
      }
    }
  }
  
  return {
    error: null,
    forcedSelect: "id,username,cookie_data",
    forcedParams: { limit: "1" }
  };
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathArray = resolvedParams.path || [];
  const pathStr = pathArray.join("/");
  
  // 1. Verify token (reject wildcard tokens by passing false)
  const requiredScopes = determineRequiredScopes(pathArray, req.method);
  
  if (!requiredScopes) {
    return NextResponse.json({ error: "Endpoint not allowed or unsupported method" }, { status: 403 });
  }

  const { token, error, status } = await verifyApiToken(req, requiredScopes, false);
  
  if (error || !token) {
    return NextResponse.json({ error }, { status });
  }

  // Chặn các query parameter nguy hiểm/không cần thiết
  for (const [key, value] of req.nextUrl.searchParams.entries()) {
    if (key === "or" || key === "and") {
      return NextResponse.json({ error: "Complex filters like 'or'/'and' are not allowed" }, { status: 400 });
    }
    if (value.startsWith("not.") || value.includes(".not.")) {
      return NextResponse.json({ error: "'not' filter is not allowed" }, { status: 400 });
    }
  }

  // Giới hạn limit
  const limitParam = req.nextUrl.searchParams.get("limit");
  if (limitParam) {
    const limitVal = parseInt(limitParam, 10);
    if (isNaN(limitVal) || limitVal > 100) {
      return NextResponse.json({ error: "Limit must be a valid number <= 100" }, { status: 400 });
    }
  }

  // Validate order format và column
  const orderParam = req.nextUrl.searchParams.get("order");
  if (orderParam) {
    const orderRegex = /^[a-zA-Z0-9_]+\.(asc|desc)(\.nullsfirst|\.nullslast)?$/;
    if (!orderRegex.test(orderParam)) {
      return NextResponse.json({ error: "Invalid order format" }, { status: 400 });
    }
    const orderCol = orderParam.split(".")[0];
    const allowedCols = ALLOWED_COLUMNS[pathStr];
    if (allowedCols && !allowedCols.includes(orderCol)) {
      return NextResponse.json({ error: `Disallowed column in order: ${orderCol}` }, { status: 400 });
    }
  }

  // Cưỡng chế và validate cho crawler_accounts GET
  let forcedSelect = "";
  let forcedParams: Record<string, string> = {};

  if (req.method === "GET" && pathStr === "crawler_accounts") {
    const validation = validateCrawlerAccountGet(req.nextUrl.searchParams);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    forcedSelect = validation.forcedSelect || "";
    forcedParams = validation.forcedParams || {};
  }

  // Validate select parameter và cưỡng chế select an toàn
  let selectParam = req.nextUrl.searchParams.get("select");
  const allowedCols = ALLOWED_COLUMNS[pathStr];
  
  if (pathStr === "crawler_accounts" && req.method === "GET") {
    selectParam = forcedSelect;
  } else if (req.method === "GET" || selectParam) {
    if (allowedCols) {
      if (!selectParam) {
        selectParam = allowedCols.join(",");
      } else {
        if (selectParam.includes("*")) {
          return NextResponse.json({ error: "Wildcard select (*) is not allowed" }, { status: 400 });
        }
        const cols = selectParam.split(",").map(c => c.trim());
        for (const col of cols) {
          if (col.includes("(") || col.includes(")") || col.includes(".") || col.includes(":")) {
            return NextResponse.json({ error: `Join queries or aliases are not allowed in select: ${col}` }, { status: 400 });
          }
          if (!allowedCols.includes(col)) {
            return NextResponse.json({ error: `Disallowed column in select: ${col}` }, { status: 400 });
          }
        }
      }
    }
  }

  // Basic security validation for structural integrity & payload whitelisting
  let parsedBody: unknown = null;
  
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      parsedBody = await req.json();
    } catch {
      // Ignore if body is not JSON or empty
    }
  }

  // Validate Request Body Whitelists
  if (parsedBody && typeof parsedBody === "object") {
    if (req.method === "PATCH") {
      const patchWhitelist = PATCH_WHITELISTS[pathStr];
      if (patchWhitelist) {
        const idParam = req.nextUrl.searchParams.get("id");
        if (!idParam) {
          return NextResponse.json({ error: "Missing id parameter for update" }, { status: 400 });
        }
        const uuidRegex = /^eq\.[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(idParam)) {
          return NextResponse.json({ error: "Invalid id format. Expected eq.<uuid>" }, { status: 400 });
        }

        if (!validatePayload(parsedBody, patchWhitelist)) {
          return NextResponse.json({ error: `Disallowed fields in PATCH body. Only ${patchWhitelist.join(", ")} are allowed.` }, { status: 400 });
        }
      }
    } else if (req.method === "POST") {
      const postWhitelist = POST_WHITELISTS[pathStr];
      if (postWhitelist && !validatePayload(parsedBody, postWhitelist)) {
        return NextResponse.json({ error: `Disallowed fields in POST body. Only ${postWhitelist.join(", ")} are allowed.` }, { status: 400 });
      }
    }
  }

  // Mã hóa cookie_data trước khi lưu vào DB (dành cho POST crawler_accounts)
  if (req.method === "POST" && pathStr === "crawler_accounts" && parsedBody) {
    const encryptBody = (item: unknown) => {
      if (item && typeof item === "object" && "cookie_data" in item) {
        const record = item as Record<string, unknown>;
        if (typeof record.cookie_data === "string") {
          record.cookie_data = encrypt(record.cookie_data);
        }
      }
    };
    if (Array.isArray(parsedBody)) {
      parsedBody.forEach(encryptBody);
    } else {
      encryptBody(parsedBody);
    }
  }

  // 2. Prepare forward request to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Construct target URL including search params
  const targetUrl = new URL(`${supabaseUrl}/rest/v1/${pathArray.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key === "select") return; // Skip original select parameter
    if (forcedParams && key in forcedParams) return; // Skip original parameter if forced
    targetUrl.searchParams.append(key, value);
  });
  
  if (forcedParams) {
    for (const [key, value] of Object.entries(forcedParams)) {
      targetUrl.searchParams.set(key, value);
    }
  }
  
  if (selectParam) {
    targetUrl.searchParams.set("select", selectParam); // Use validated select parameter
  }

  // Prepare headers, stripping out internal Next.js headers and replacing auth with Service Role Key
  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    // Skip some headers
    if (["host", "connection", "content-length", "authorization", "x-api-key"].includes(key.toLowerCase())) {
      return;
    }
    forwardHeaders.set(key, value);
  });
  forwardHeaders.set("apikey", serviceRoleKey);
  forwardHeaders.set("Authorization", `Bearer ${serviceRoleKey}`);

  // Fetch from Supabase
  try {
    let bodyPayload;
    if (req.method !== "GET" && req.method !== "HEAD") {
      bodyPayload = parsedBody ? JSON.stringify(parsedBody) : undefined;
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body: bodyPayload,
      // @ts-expect-error - Next.js extended fetch options
      duplex: 'half' 
    });

    // Create a new response to stream back to the client
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Don't forward content-encoding to avoid double-compression issues
      if (key.toLowerCase() !== "content-encoding") {
        responseHeaders.set(key, value);
      }
    });

    // Giải mã cookie_data khi trả về cho worker (dành cho GET crawler_accounts)
    if (req.method === "GET" && pathStr === "crawler_accounts" && response.status === 200) {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          const decryptAccount = (acc: unknown) => {
            if (acc && typeof acc === "object" && "cookie_data" in acc) {
              const record = acc as Record<string, unknown>;
              if (typeof record.cookie_data === "string") {
                record.cookie_data = decrypt(record.cookie_data);
              }
            }
          };
          if (Array.isArray(json)) {
            json.forEach(decryptAccount);
          } else if (json && typeof json === "object") {
            decryptAccount(json);
          }
          
          // Delete Content-Length since the body size changes after decryption
          responseHeaders.delete("content-length");
          
          return new NextResponse(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          });
        } catch (parseErr) {
          console.error("Failed to parse response JSON for decrypting cookie_data:", parseErr);
        }
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Failed to connect to backend service" }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;

