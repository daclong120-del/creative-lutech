import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Utility for creating formatted terminal output
class TableReporter {
  private results: Array<{ test: string; layer: string; status: "PASS" | "FAIL"; details: string }> = [];

  add(test: string, layer: string, status: "PASS" | "FAIL", details: string) {
    this.results.push({ test, layer, status, details });
  }

  print() {
    console.log("\n==========================================================================================");
    console.log("                       SECURITY REGRESSION TEST REPORT                                     ");
    console.log("==========================================================================================");
    console.log(String("Test Case").padEnd(45) + " | " + String("Layer").padEnd(12) + " | " + String("Status").padEnd(6) + " | " + "Details");
    console.log("-".repeat(95));
    for (const r of this.results) {
      const statusStr = r.status === "PASS" ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
      console.log(r.test.padEnd(45) + " | " + r.layer.padEnd(12) + " | " + statusStr.padEnd(15) + " | " + r.details);
    }
    console.log("==========================================================================================\n");
  }

  hasFailed() {
    return this.results.some(r => r.status === "FAIL");
  }
}

async function runRegressionTests() {
  const reporter = new TableReporter();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@sinomedia.vn";
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || "sinomedia123";
  const userEmail = process.env.TEST_USER_EMAIL || "user@sinomedia.vn";
  const userPassword = process.env.TEST_USER_PASSWORD || "sinomedia123";

  // Next.js Dev/Prod server url to test the REST proxy
  const proxyBaseUrl = process.env.INTERNAL_API_URL || "http://localhost:3000";

  console.log("Starting security regression tests...");
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Proxy URL: ${proxyBaseUrl}`);

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Missing SUPABASE environment config variables!");
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // ==========================================
  // PART 1: DB Row Level Security (RLS) Tests
  // ==========================================
  
  // 1.1. Anon Key tests
  const tablesToTestAnon = ["crawler_accounts", "crawler_tasks", "api_tokens", "audit_logs"];
  for (const table of tablesToTestAnon) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403 || (body && (body as any).code === "42501")) {
        reporter.add(`Anon read blocked on ${table}`, "Database RLS", "PASS", `HTTP ${res.status}`);
      } else {
        reporter.add(`Anon read blocked on ${table}`, "Database RLS", "FAIL", `Allowed reading! HTTP ${res.status}`);
      }
    } catch (err: any) {
      reporter.add(`Anon read blocked on ${table}`, "Database RLS", "FAIL", `Error: ${err.message}`);
    }
  }

  // Login users to get JWTs for RLS Testing
  let adminJwt = "";
  let userJwt = "";

  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    if (authRes.ok) {
      const data = await authRes.json();
      adminJwt = data.access_token;
    } else {
      console.error(`CRITICAL: Admin login failed. HTTP ${authRes.status}: ${await authRes.text()}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error("CRITICAL: Failed to log in admin test account:", err.message);
    process.exit(1);
  }

  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    });
    if (authRes.ok) {
      const data = await authRes.json();
      userJwt = data.access_token;
    } else {
      console.error(`CRITICAL: User login failed. HTTP ${authRes.status}: ${await authRes.text()}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error("CRITICAL: Failed to log in user test account:", err.message);
    process.exit(1);
  }

  if (!adminJwt || !userJwt) {
    console.error("CRITICAL: Missing admin or user JWT token! Test environment is not initialized correctly.");
    process.exit(1);
  }

  // 1.2. Regular User RLS tests
  const sensitiveTables = ["api_tokens", "crawler_accounts", "audit_logs", "crawler_tasks"];
  for (const table of sensitiveTables) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${userJwt}` }
      });
      const body = await res.json().catch(() => []);
      if (res.status === 401 || res.status === 403 || (Array.isArray(body) && body.length === 0)) {
        reporter.add(`User read restricted on ${table}`, "Database RLS", "PASS", `HTTP ${res.status}, Length: ${body.length || 0}`);
      } else {
        reporter.add(`User read restricted on ${table}`, "Database RLS", "FAIL", `Returned data! Length: ${body.length}`);
      }
    } catch (err: any) {
      reporter.add(`User read restricted on ${table}`, "Database RLS", "FAIL", `Error: ${err.message}`);
    }
  }

  // 1.3. Admin RLS tests
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/crawler_tasks?limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${adminJwt}` }
    });
    if (res.status === 200) {
      reporter.add("Admin read allowed on crawler_tasks", "Database RLS", "PASS", "HTTP 200");
    } else {
      const body = await res.text();
      reporter.add("Admin read allowed on crawler_tasks", "Database RLS", "FAIL", `HTTP ${res.status}: ${body}`);
    }
  } catch (err: any) {
    reporter.add("Admin read allowed on crawler_tasks", "Database RLS", "FAIL", `Error: ${err.message}`);
  }

  // ==========================================
  // PART 2: REST Proxy Hardening Tests
  // ==========================================

  // Setup mock tokens in Database for testing
  const testTokenPlain = "test_sec_token_" + crypto.randomBytes(16).toString("hex");
  const testTokenHash = crypto.createHash("sha256").update(testTokenPlain).digest("hex");
  
  const wildcardTokenPlain = "test_wildcard_" + crypto.randomBytes(16).toString("hex");
  const wildcardTokenHash = crypto.createHash("sha256").update(wildcardTokenPlain).digest("hex");

  const invalidScopeTokenPlain = "test_invalid_scope_" + crypto.randomBytes(16).toString("hex");
  const invalidScopeTokenHash = crypto.createHash("sha256").update(invalidScopeTokenPlain).digest("hex");

  try {
    // Insert test tokens
    const insertRes = await supabaseAdmin.from("api_tokens").insert([
      {
        name: "Security Test Scope Token",
        token_hash: testTokenHash,
        token_prefix: "test_sec",
        scopes: ["crawler:read_task", "crawler:update_task", "crawler:read_accounts"],
        status: "active"
      },
      {
        name: "Security Test Wildcard Token",
        token_hash: wildcardTokenHash,
        token_prefix: "test_wildcard",
        scopes: ["*"],
        status: "active"
      },
      {
        name: "Security Test Invalid Scope Token",
        token_hash: invalidScopeTokenHash,
        token_prefix: "test_invalid",
        scopes: ["crawler:read_task"], // Không có crawler:read_accounts
        status: "active"
      }
    ]).select();
    console.log("Insert test tokens result:", JSON.stringify(insertRes));
  } catch (err) {
    console.error("Failed to insert security test tokens into DB! Ensure DB is running. Error:", err);
    process.exit(1);
  }

  // Helper fetch function through REST Proxy
  const fetchProxy = (path: string, options: any = {}, token = testTokenPlain) => {
    const url = `${proxyBaseUrl}/api/worker/rest/v1/${path}`;
    const headers = {
      "x-api-key": token,
      "Content-Type": "application/json",
      ...options.headers
    };
    return fetch(url, { ...options, headers });
  };

  // 2.1. Test Scope Enforcement (sai scope)
  try {
    const res = await fetchProxy("crawler_accounts?limit=1", {}, invalidScopeTokenPlain);
    if (res.status === 403) {
      reporter.add("Token insufficient scope blocked", "REST Proxy", "PASS", "HTTP 403 Forbidden");
    } else {
      reporter.add("Token insufficient scope blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Token insufficient scope blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.2. Test Wildcard Block
  try {
    const res = await fetchProxy("crawler_tasks?limit=1", {}, wildcardTokenPlain);
    if (res.status === 403) {
      reporter.add("Wildcard (*) token blocked", "REST Proxy", "PASS", "HTTP 403 (Wildcard rejected)");
    } else {
      reporter.add("Wildcard (*) token blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Wildcard (*) token blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.3. Test Wildcard Select Block (select=*)
  try {
    const res = await fetchProxy("crawler_tasks?select=*");
    if (res.status === 400) {
      reporter.add("Wildcard select (*) blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Wildcard select (*) blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Wildcard select (*) blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.4. Test Disallowed Column Select
  try {
    const res = await fetchProxy("crawler_tasks?select=id,some_nonexistent_column");
    if (res.status === 400) {
      reporter.add("Disallowed column select blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Disallowed column select blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Disallowed column select blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.5. Test Join/Alias Attempt Block
  try {
    const res = await fetchProxy("crawler_tasks?select=id,crawler_accounts(*)");
    if (res.status === 400) {
      reporter.add("Join query select blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Join query select blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Join query select blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.6. Test Or/And filters block
  try {
    const res = await fetchProxy("crawler_tasks?or=(status.eq.pending,status.eq.running)");
    if (res.status === 400) {
      reporter.add("Complex 'or' filter blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Complex 'or' filter blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Complex 'or' filter blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.7. Test Not filter block
  try {
    const res = await fetchProxy("crawler_tasks?status=not.eq.completed");
    if (res.status === 400) {
      reporter.add("'not' filter blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("'not' filter blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("'not' filter blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.8. Test Limit Restriction
  try {
    const res = await fetchProxy("crawler_tasks?limit=101");
    if (res.status === 400) {
      reporter.add("Large limit (>100) blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Large limit (>100) blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Large limit (>100) blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.9. Test Invalid Order Block
  try {
    const res = await fetchProxy("crawler_tasks?order=status.asc;drop table crawler_tasks");
    if (res.status === 400) {
      reporter.add("Invalid order format blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Invalid order format blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Invalid order format blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.10. Test Valid GET Request with Auto-select whitelist columns
  try {
    const res = await fetchProxy("crawler_tasks?limit=1");
    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const hasDisallowedField = data.some(item => {
          const keys = Object.keys(item);
          return keys.some(k => k === "created_by" || k === "raw_db_field_etc");
        });
        if (!hasDisallowedField) {
          reporter.add("Auto-gated select columns", "REST Proxy", "PASS", "Only whitelisted columns returned");
        } else {
          reporter.add("Auto-gated select columns", "REST Proxy", "FAIL", "Returned non-whitelisted columns");
        }
      } else {
        reporter.add("Auto-gated select columns", "REST Proxy", "PASS", "Empty task pool (HTTP 200)");
      }
    } else {
      reporter.add("Auto-gated select columns", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Auto-gated select columns", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.11. Test Mutating Payload Whitelist (PATCH with invalid fields)
  try {
    const fakeUuid = "00000000-0000-0000-0000-000000000000";
    const res = await fetchProxy(`crawler_tasks?id=eq.${fakeUuid}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        nonexistent_field_attacker: "malicious_payload"
      })
    });
    if (res.status === 400) {
      reporter.add("Disallowed fields in PATCH blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("Disallowed fields in PATCH blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("Disallowed fields in PATCH blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.12. Test crawler_accounts: GET without params => 400
  try {
    const res = await fetchProxy("crawler_accounts");
    if (res.status === 400) {
      reporter.add("crawler_accounts GET no params blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("crawler_accounts GET no params blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET no params blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.13. Test crawler_accounts: GET limit=100 => 400
  try {
    const res = await fetchProxy("crawler_accounts?limit=100");
    if (res.status === 400) {
      reporter.add("crawler_accounts GET limit=100 blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("crawler_accounts GET limit=100 blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET limit=100 blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.14. Test crawler_accounts: GET Mode 1 Checkout valid => 200, length <= 1, only id/username/cookie_data
  try {
    const res = await fetchProxy("crawler_accounts?platform=eq.bilibili&status=eq.active&order=last_used_at.asc.nullsfirst&limit=1");
    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length <= 1) {
          const hasInvalidField = data.some(item => {
            const keys = Object.keys(item);
            return keys.some(k => k !== "id" && k !== "username" && k !== "cookie_data");
          });
          if (!hasInvalidField) {
            reporter.add("crawler_accounts GET checkout allowed", "REST Proxy", "PASS", "HTTP 200, length <= 1, fields whitelisted");
          } else {
            reporter.add("crawler_accounts GET checkout allowed", "REST Proxy", "FAIL", `Returned disallowed fields: ${Object.keys(data[0]).join(",")}`);
          }
        } else {
          reporter.add("crawler_accounts GET checkout allowed", "REST Proxy", "FAIL", `Returned length: ${data.length} > 1`);
        }
      } else {
        reporter.add("crawler_accounts GET checkout allowed", "REST Proxy", "FAIL", "Response data is not an array");
      }
    } else {
      reporter.add("crawler_accounts GET checkout allowed", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET checkout allowed", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.15. Test crawler_accounts: GET Mode 1 Checkout limit=2 => 400
  try {
    const res = await fetchProxy("crawler_accounts?platform=eq.bilibili&status=eq.active&order=last_used_at.asc.nullsfirst&limit=2");
    if (res.status === 400) {
      reporter.add("crawler_accounts GET checkout limit=2 blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("crawler_accounts GET checkout limit=2 blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET checkout limit=2 blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.16. Test crawler_accounts: GET Mode 2 Read status by id => 200 or [] but no cookie_data
  const testUuid = crypto.randomUUID();
  try {
    const res = await fetchProxy(`crawler_accounts?id=eq.${testUuid}`);
    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const hasCookieData = data.some(item => "cookie_data" in item);
        if (!hasCookieData) {
          reporter.add("crawler_accounts GET status by id allowed", "REST Proxy", "PASS", "HTTP 200, no cookie_data returned");
        } else {
          reporter.add("crawler_accounts GET status by id allowed", "REST Proxy", "FAIL", "Returned cookie_data in status mode!");
        }
      } else {
        reporter.add("crawler_accounts GET status by id allowed", "REST Proxy", "FAIL", "Response data is not an array");
      }
    } else {
      reporter.add("crawler_accounts GET status by id allowed", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET status by id allowed", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.17. Test crawler_accounts: GET Mode 2 with select=cookie_data => 400
  try {
    const res = await fetchProxy(`crawler_accounts?id=eq.${testUuid}&select=cookie_data`);
    if (res.status === 400) {
      reporter.add("crawler_accounts GET status select cookie_data blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("crawler_accounts GET status select cookie_data blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET status select cookie_data blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // 2.18. Test crawler_accounts: GET username=eq.admin => 400
  try {
    const res = await fetchProxy("crawler_accounts?username=eq.admin");
    if (res.status === 400) {
      reporter.add("crawler_accounts GET search by username blocked", "REST Proxy", "PASS", "HTTP 400 Bad Request");
    } else {
      reporter.add("crawler_accounts GET search by username blocked", "REST Proxy", "FAIL", `HTTP ${res.status}`);
    }
  } catch (err: any) {
    reporter.add("crawler_accounts GET search by username blocked", "REST Proxy", "FAIL", `Error: ${err.message}`);
  }

  // ==========================================
  // Clean up mock tokens
  // ==========================================
  try {
    await supabaseAdmin.from("api_tokens").delete().in("token_hash", [testTokenHash, wildcardTokenHash, invalidScopeTokenHash]);
    console.log("Cleaned up security test tokens successfully.");
  } catch (err) {
    console.error("Failed to clean up security test tokens:", err);
  }

  // Print final results
  reporter.print();

  if (reporter.hasFailed()) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRegressionTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
