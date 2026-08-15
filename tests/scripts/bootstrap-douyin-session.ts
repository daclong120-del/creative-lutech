import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { bootstrapDouyinSession } from "../src/crawl/douyin/session_bootstrap.js";

async function main() {
  console.log("=============================================================");
  console.log("🚀 BOOTSTRAP DOUYIN SESSION VIA REAL BROWSER (NON-HEADLESS)");
  console.log("=============================================================\n");

  const session = await bootstrapDouyinSession({
    headless: false,
    timeoutMs: 45000,
  });

  const outputDir = join(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, "session.json");

  writeFileSync(outputPath, JSON.stringify(session, null, 2), "utf8");

  console.log(`\n✅ Douyin Session bootstrapped successfully and saved to: ${outputPath}`);
  console.log(`- WebId:       ${session.webid || "(missing)"}`);
  console.log(`- MsToken:     ${session.msToken ? session.msToken.substring(0, 15) + "..." : "(missing)"}`);
  console.log(`- UIFID:       ${session.uifid ? session.uifid.substring(0, 15) + "..." : "(missing)"}`);
  console.log(`- Cookies:     ${session.cookies.length} items`);
  console.log(`- UserAgent:   ${session.userAgent}`);
}

main().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
