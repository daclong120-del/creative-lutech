import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { searchAweme } from "../../crawler-pipeline/src/crawl/douyin/api.js";

async function main() {
  const cookiePath = join(process.cwd(), "scratch", "cookie_doyin.json");
  const content = readFileSync(cookiePath, "utf8");
  const raw = JSON.parse(content);
  const session = createSessionFromRaw(raw, "inspect");

  console.log("Calling searchAweme for 'marketing'...");
  const res = await searchAweme(session, "marketing", 0);
  console.log("Response Keys:", Object.keys(res));
  console.log("Status Code:", res.status_code);
  console.log("Status Msg:", res.status_msg);
  
  if (res.data) {
    console.log("Data length:", res.data.length);
  } else {
    console.log("No data array found.");
  }
  
  // Print first 500 characters of response JSON string
  console.log("Response JSON snippet:", JSON.stringify(res).substring(0, 800));
}

main().catch(console.error);
