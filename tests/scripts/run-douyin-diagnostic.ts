import { readFileSync, existsSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { runSessionDiagnostic } from "../src/crawl/douyin/session_diagnostic.js";
import { supabaseRest } from "../src/store/supabase_client.js";

async function main() {
  console.log("=============================================================");
  console.log("🔍 RUNNING READ-ONLY DOUYIN SESSION DIAGNOSTIC RUNNER");
  console.log("=============================================================\n");

  let sessionRaw: any = null;
  let sourceLabel = "";

  // 1. Check if a custom file path is provided via CLI argument
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const customPath = args[0];
    const absPath = isAbsolute(customPath) ? customPath : join(process.cwd(), customPath);
    console.log(`Checking CLI argument file path: ${absPath}...`);
    if (existsSync(absPath)) {
      try {
        sessionRaw = JSON.parse(readFileSync(absPath, "utf8"));
        sourceLabel = `CLI File (${customPath})`;
      } catch (err: any) {
        console.error(`❌ Error parsing JSON from ${customPath}: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Custom session file not found: ${absPath}`);
      process.exit(1);
    }
  }

  // 2. Fallback to default output/session.json
  if (!sessionRaw) {
    const defaultPath = join(process.cwd(), "output", "session.json");
    console.log(`No CLI argument provided. Checking default path: ${defaultPath}...`);
    if (existsSync(defaultPath)) {
      try {
        sessionRaw = JSON.parse(readFileSync(defaultPath, "utf8"));
        sourceLabel = "Default local session.json";
      } catch (err: any) {
        console.warn(`Warning: Failed to parse default session.json: ${err.message}`);
      }
    }
  }

  // 3. Fallback to DB pool (Read-only check)
  if (!sessionRaw) {
    console.log("No local session file found. Fetching first Douyin account from DB pool...");
    try {
      const accounts = await supabaseRest("crawler_accounts", {
        method: "GET",
        params: {
          platform: "eq.douyin",
          order: "last_used_at.asc.nullsfirst",
          limit: "1"
        }
      });

      if (accounts && accounts.length > 0) {
        const acc = accounts[0];
        console.log(`Found pool account: ${acc.username} (Status: ${acc.status})`);
        try {
          sessionRaw = JSON.parse(acc.cookie_data);
          sourceLabel = `DB Pool Account (${acc.username})`;
        } catch {
          sessionRaw = acc.cookie_data;
          sourceLabel = `DB Pool Account (${acc.username})`;
        }
      } else {
        console.error("❌ No Douyin accounts found in the database.");
      }
    } catch (err: any) {
      console.error(`❌ Failed to read from DB pool: ${err.message}`);
    }
  }

  if (!sessionRaw) {
    console.error("\n❌ ERROR: No session data source available. Please provide a path to a golden session JSON file.");
    console.log("\nUsage:\n  npm run douyin:diagnostic <path_to_session_json>");
    process.exit(1);
  }

  console.log(`\nSuccessfully loaded session from: ${sourceLabel}`);
  
  // Parse session using strict rules
  const session = createSessionFromRaw(sessionRaw, "runner");

  console.log("\n--- Session Properties Captured ---");
  console.log(`- WebId:       ${session.webid || "(missing)"}`);
  console.log(`- MsToken:     ${session.msToken || "(missing)"}`);
  console.log(`- UserAgent:   ${session.userAgent || "(missing)"}`);
  console.log(`- Browser Name: ${session.browserName} (${session.browserVersion})`);
  console.log(`- Platform:    ${session.browserPlatform}`);
  console.log(`- Language:    ${session.browserLanguage}`);
  console.log(`- Cookies:     ${session.cookies?.length || 0} items`);
  console.log(`- CookieStr:   ${session.cookieString ? session.cookieString.substring(0, 100) + "..." : "(missing)"}`);
  console.log("------------------------------------\n");

  console.log("Executing chẩn đoán phiên...");
  const isHealthy = await runSessionDiagnostic(session);

  console.log("\n=============================================================");
  if (isHealthy) {
    console.log("🎉 DIAGNOSTIC RESULT: SUCCESS (Session is 100% HEALTHY & ALIVE!)");
    console.log("This session is fully authenticated and ready for real crawling.");
  } else {
    console.log("❌ DIAGNOSTIC RESULT: FAILED (Session is UNHEALTHY or BLOCKED)");
    console.log("Please inspect the checkpoint failure logs above to debug.");
  }
  console.log("=============================================================");

  process.exit(isHealthy ? 0 : 1);
}

main().catch(console.error);
