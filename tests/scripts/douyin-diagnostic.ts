import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { runSessionDiagnostic } from "../src/crawl/douyin/session_diagnostic.js";

async function main() {
  console.log("=============================================================");
  console.log("🔍 DOUYIN SESSION DIAGNOSTIC RUNNER");
  console.log("=============================================================\n");

  const sessionPath = join(process.cwd(), "output", "session.json");
  if (!existsSync(sessionPath)) {
    console.error(`❌ Session file not found at: ${sessionPath}`);
    console.error("Please run: npm run douyin:bootstrap first!");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(sessionPath, "utf8"));
  const session = createSessionFromRaw(raw, "local-diagnostic");

  console.log("Loaded session details:");
  console.log(`- WebId:     ${session.webid || "(missing)"}`);
  console.log(`- MsToken:   ${session.msToken ? session.msToken.substring(0, 15) + "..." : "(missing)"}`);
  console.log(`- UIFID:     ${session.uifid ? session.uifid.substring(0, 15) + "..." : "(missing)"}`);
  console.log(`- Cookies:   ${session.cookies?.length || 0} items`);
  console.log("------------------------------------\n");

  const pass = await runSessionDiagnostic(session);
  if (pass) {
    console.log("\n🎉 DIAGNOSTIC RESULT: PASS (Session healthy and alive!)");
    process.exit(0);
  } else {
    console.log("\n❌ DIAGNOSTIC RESULT: FAIL (Session blocked or invalid)");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Diagnostic error:", err);
  process.exit(1);
});
