import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { searchAweme } from "../src/crawl/douyin/api.js";

function generateMsToken(length = 107): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let result = "";
  for (let i = 0; i < length - 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + "==";
}

async function main() {
  const cookiePath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  const content = readFileSync(cookiePath, "utf8");
  const raw = JSON.parse(content);
  const session = createSessionFromRaw(raw, "test");

  console.log("Original msToken:", session.msToken);
  
  // Test with original msToken
  try {
    const res = await searchAweme(session, "test", 0, "");
    console.log("Original search success, results count:", res.data?.length ?? 0);
  } catch (err: any) {
    console.log("Original search failed:", err.message);
  }

  // Test with randomized msToken
  const randomToken = generateMsToken(session.msToken.length || 107);
  session.msToken = randomToken;
  console.log("\nRandomized msToken:", session.msToken);

  try {
    const res = await searchAweme(session, "test", 0, "");
    console.log("Randomized search success, results count:", res.data?.length ?? 0);
  } catch (err: any) {
    console.log("Randomized search failed:", err.message);
  }
}

main().catch(console.error);
