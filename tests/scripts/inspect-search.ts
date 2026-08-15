import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { searchAweme } from "../src/crawl/douyin/api.js";

async function main() {
  try {
    const sessionPath = join(process.cwd(), "output", "session.json");
    const raw = JSON.parse(readFileSync(sessionPath, "utf8"));
    const session = createSessionFromRaw(raw, "local-diagnostic");

    console.log("Calling searchAweme...");
    const res = await searchAweme(session, "girl", 0);
    console.log("Response Keys:", Object.keys(res || {}));
    if (res?.data) {
      console.log("res.data length:", res.data.length);
    }
    console.log("Sample response:", JSON.stringify(res).substring(0, 1000));
  } catch (err: any) {
    console.error("Error in inspect-search:", err?.stack || err?.message || err);
  }
}

main().catch(console.error);
