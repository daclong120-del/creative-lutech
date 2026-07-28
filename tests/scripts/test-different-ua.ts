import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { douyinGet } from "../src/crawl/douyin/http_client.js";

const UAs = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

async function testUA(sessionRaw: any, ua: string) {
  console.log(`\n=========================================`);
  console.log(`Testing with User-Agent: ${ua}`);
  console.log(`=========================================`);
  
  sessionRaw.userAgent = ua;
  const session = createSessionFromRaw(sessionRaw, "test-ua");
  
  try {
    console.log("1. Calling getSelfProfile...");
    const selfRes = await douyinGet("/aweme/v1/web/user/profile/self/", {}, session, { sign: true });
    console.log("Profile success! Nickname:", selfRes.user?.nickname);
    
    console.log("2. Calling searchAweme...");
    const searchRes = await douyinGet("/aweme/v1/web/general/search/single/", {
      search_channel: "aweme_general",
      keyword: "marketing",
      offset: "0",
      count: "10"
    }, session, { sign: true });
    
    console.log("Search status_code:", searchRes.status_code);
    console.log("Data length:", searchRes.data?.length ?? 0);
    if (searchRes.search_nil_info) {
      console.log("Nil info:", searchRes.search_nil_info);
    }
  } catch (err: any) {
    console.error("Error occurred:", err.message);
  }
}

async function main() {
  const cookiePath = join(process.cwd(), "scratch", "cookie_doyin.json");
  const raw = JSON.parse(readFileSync(cookiePath, "utf8"));
  
  for (const ua of UAs) {
    await testUA(raw, ua);
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error);
