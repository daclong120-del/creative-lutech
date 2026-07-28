import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { signDetail, signReply } from "../src/sign/douyin_sign.js";
import { buildCommonParams, requestJson } from "../src/crawl/douyin/http_client.js";

async function testSearch(session: any, referer: string, signType: "detail" | "reply", label: string) {
  console.log(`\n--- Test: ${label} ---`);
  try {
    const params = {
      search_channel: "aweme_general",
      keyword: "marketing",
      offset: "0",
      count: "10"
    };

    const allParams = { ...buildCommonParams(session), ...params };
    const queryString = Object.entries(allParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const a_bogus = signType === "detail" 
      ? signDetail(queryString, session.userAgent) 
      : signReply(queryString, session.userAgent);

    const finalUrl = `https://www.douyin.com/aweme/v1/web/general/search/single/?${queryString}&a_bogus=${a_bogus}`;

    const res = await requestJson(finalUrl, session, {
      headers: { Referer: encodeURI(referer) }
    });

    console.log("Response status_code:", res.status_code);
    console.log("Data length:", res.data?.length ?? 0);
    if (res.search_nil_info) {
      console.log("Nil info:", res.search_nil_info);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

async function main() {
  const cookiePath = join(process.cwd(), "scratch", "cookie_doyin.json");
  const raw = JSON.parse(readFileSync(cookiePath, "utf8"));
  raw.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";
  const session = createSessionFromRaw(raw, "inspect");

  // 1. Clean Referer + Sign Detail
  await testSearch(
    session,
    "https://www.douyin.com/search/marketing?type=general",
    "detail",
    "Clean Referer + Sign Detail"
  );

  // 2. Clean Referer + Sign Reply
  await testSearch(
    session,
    "https://www.douyin.com/search/marketing?type=general",
    "reply",
    "Clean Referer + Sign Reply"
  );

  // 3. Simple Referer (no query params) + Sign Detail
  await testSearch(
    session,
    "https://www.douyin.com/search/marketing",
    "detail",
    "Simple Referer + Sign Detail"
  );
}

main().catch(console.error);
