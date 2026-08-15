import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";

async function main() {
  const cookiePath = join(process.cwd(), "scratch", "cookie_doyin.json");
  const raw = JSON.parse(readFileSync(cookiePath, "utf8"));
  const session = createSessionFromRaw(raw, "inspect");

  console.log("Fetching douyin.com root page to extract new cookies...");
  
  const headers = {
    "User-Agent": session.userAgent,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Cookie": session.cookieString,
  };

  const res = await fetch("https://www.douyin.com/", {
    headers,
    redirect: "manual"
  });

  console.log("Response Status:", res.status);
  console.log("Response Headers:");
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === "set-cookie") {
      console.log(` - set-cookie: ${v}`);
    }
  }
}

main().catch(console.error);
