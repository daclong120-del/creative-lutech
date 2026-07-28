import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSessionFromRaw } from "../src/crawl/douyin/session.js";
import { douyinGet } from "../src/crawl/douyin/http_client.js";

async function testSearch(session: any, params: Record<string, string>, label: string) {
  console.log(`\n--- Test: ${label} ---`);
  try {
    const res = await douyinGet("/aweme/v1/web/general/search/single/", params, session, { sign: true });
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
  const session = createSessionFromRaw(raw, "inspect");

  // 1. Original parameters
  await testSearch(session, {
    search_channel: "aweme_general",
    enable_history: "1",
    keyword: "marketing",
    search_source: "tab_search",
    query_correct_type: "1",
    is_filter_search: "0",
    from_group_id: "7378810571505847586",
    offset: "0",
    count: "15",
    need_filter_settings: "1",
    list_type: "multi",
    search_id: "",
  }, "Original Params");

  // 2. Simplified parameters (no from_group_id)
  await testSearch(session, {
    search_channel: "aweme_general",
    keyword: "marketing",
    search_source: "search_history",
    query_correct_type: "1",
    is_filter_search: "0",
    offset: "0",
    count: "15",
    list_type: "multi",
  }, "Simplified (no from_group_id, search_history)");

  // 3. Simple Search Params (often used for guest search)
  await testSearch(session, {
    search_channel: "aweme_general",
    keyword: "marketing",
    offset: "0",
    count: "10",
  }, "Minimal Params");
}

main().catch(console.error);
