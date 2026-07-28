import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(p: string) {
  try {
    const content = fs.readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { }
}

loadEnv(path.resolve(__dirname, "../.env.local"));
loadEnv(path.resolve(__dirname, "../../.env"));
loadEnv(path.resolve(__dirname, "../../supabase/.env.local"));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const PROXY_BASE = "http://localhost:3000/api/worker/rest/v1";

async function main() {
  console.log("=== Testing API Token Guard Runtime Enforcement ===");

  // Query a valid profile ID to satisfy the foreign key constraint
  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;
  const rawToken = `sm_live_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  console.log("[+] Inserting test API token...");
  const { data: tokenData, error: insertError } = await supabase
    .from("api_tokens")
    .insert({
      name: "E2E Test Token",
      token_hash: tokenHash,
      token_prefix: rawToken.substring(0, 16),
      role_id: "admin",
      created_by: userId,
      status: "active",
      scopes: [
        "crawler:claim", "crawler:write_logs", "crawler:read_task", "crawler:update_task",
        "crawler:read_accounts", "crawler:update_accounts", "crawler:write_accounts",
        "crawler:read_data", "crawler:write_data", "crawler:update_data"
      ]
    })
    .select()
    .single();

  if (insertError) {
    console.error("[-] Failed to insert token:", insertError);
    return;
  }
  const tokenId = tokenData.id;

  async function check(name: string, url: string, method: string, expectedStatus: number, body?: any, tokenOverride?: string) {
    process.stdout.write(`  - ${name}... `);
    const headers: any = {};
    if (tokenOverride !== undefined) {
      if (tokenOverride) headers["Authorization"] = `Bearer ${tokenOverride}`;
    } else {
      headers["Authorization"] = `Bearer ${rawToken}`;
    }

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const res = await fetch(`${PROXY_BASE}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.status === expectedStatus) {
        console.log(`✅ Passed (${res.status})`);
      } else {
        const text = await res.text();
        console.log(`❌ Failed. Expected ${expectedStatus}, got ${res.status}. Body: ${text}`);
      }
    } catch (err: any) {
      if (err.cause?.code === 'ECONNREFUSED') {
        throw err;
      }
      console.log(`❌ Network Error: ${err.message}`);
    }
  }

  try {
    console.log("\n[1] Authentication & Basic Authorization");
    await check("No token", "/rpc/claim_next_crawler_task", "POST", 401, undefined, "");
    await check("Invalid token", "/rpc/claim_next_crawler_task", "POST", 401, undefined, "sm_live_fake");
    await check("Unknown endpoint", "/invalid_endpoint", "GET", 403);

    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    console.log("\n[2] Valid Scopes & Methods (Expect 200/204/etc, not 401/403)");
    await check("POST rpc/claim_next_crawler_task", "/rpc/claim_next_crawler_task", "POST", 200, {}); // Expect 200 (returns jsonb)
    await check("GET crawler_accounts", "/crawler_accounts", "GET", 200);
    await check("PATCH crawler_accounts", `/crawler_accounts?id=eq.${validUUID}`, "PATCH", 204, { status: "active" }); // Assuming no content on PATCH
    await check("GET crawled_authors", "/crawled_authors?limit=1", "GET", 200);
    await check("PATCH crawled_authors", `/crawled_authors?id=eq.${validUUID}`, "PATCH", 204, { fans_count: 100 });
    await check("PATCH crawled_posts", `/crawled_posts?id=eq.${validUUID}`, "PATCH", 204, { stats: {} });

    console.log("\n[3] Mass update attempts (Expect 400)");
    await check("PATCH crawler_tasks?id=not.is.null", "/crawler_tasks?id=not.is.null", "PATCH", 400);
    await check("PATCH crawler_accounts?id=not.is.null", "/crawler_accounts?id=not.is.null", "PATCH", 400);
    await check("PATCH crawled_posts?id=not.is.null", "/crawled_posts?id=not.is.null", "PATCH", 400);
    await check("PATCH crawled_authors?id=not.is.null", "/crawled_authors?id=not.is.null", "PATCH", 400);

    console.log("\n[4] Disallowed body (Expect 400)");
    await check("PATCH crawler_tasks body { target: 'x' }", `/crawler_tasks?id=eq.${validUUID}`, "PATCH", 400, { target: "x" });
    await check("PATCH crawler_accounts body { cookie_data: 'x' }", `/crawler_accounts?id=eq.${validUUID}`, "PATCH", 400, { cookie_data: "x" });
    await check("PATCH crawled_posts body { title: 'x' }", `/crawled_posts?id=eq.${validUUID}`, "PATCH", 400, { title: "x" });
    await check("PATCH crawled_authors body { nickname: 'x' }", `/crawled_authors?id=eq.${validUUID}`, "PATCH", 400, { nickname: "x" });

    console.log("\n[5] Token Revocation & Expiry");
    // Revoked token
    await supabase.from("api_tokens").update({ status: "revoked" }).eq("id", tokenId);
    await check("Revoked token", "/rpc/claim_next_crawler_task", "POST", 401);

    // Expired token
    await supabase.from("api_tokens").update({ status: "active", expires_at: new Date(Date.now() - 10000).toISOString() }).eq("id", tokenId);
    await check("Expired token", "/rpc/claim_next_crawler_task", "POST", 401);

    console.log("\n✅ All tests finished.");
  } catch (err: any) {
    if (err.cause?.code === 'ECONNREFUSED') {
      console.log("\n⚠️ Next.js server is not running on localhost:3000. Skipping proxy tests.");
    } else {
      console.error("\n❌ Test failed:", err.message);
    }
  } finally {
    console.log("\n[+] Cleaning up test token...");
    await supabase.from("api_tokens").delete().eq("id", tokenId);
    try { await supabase.auth.admin.deleteUser(userId); } catch { }
  }
}

main();