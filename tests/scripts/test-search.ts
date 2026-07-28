import { bilibiliGet, setBilibiliCookie, pong } from "../src/crawl/bilibili/client.js";

async function testSearch(cookieVal: string, label: string) {
  console.log(`\nTesting search [${label}] with cookie length: ${cookieVal.length}...`);
  setBilibiliCookie(cookieVal);
  try {
    const isLogin = await pong();
    console.log(`-> pong (isLogin): ${isLogin}`);
  } catch (err: any) {
    console.log(`-> pong error: ${err.message}`);
  }

  try {
    const res = await bilibiliGet(
      "/x/web-interface/wbi/search/type",
      {
        search_type: "video",
        keyword: "IPTV",
        page: "1",
        page_size: "3",
        order: "totalrank",
      },
      true
    );
    const results = res.result || [];
    console.log(`-> Search success! Found ${results.length} items.`);
    if (results.length > 0) {
      console.log(`   Sample: ${results[0].bvid} - ${results[0].title}`);
    }
  } catch (err: any) {
    console.log(`-> Search failed: ${err.message}`);
  }
}

async function main() {
  // Test 1: Completely empty cookie
  await testSearch("", "Empty Cookie / Guest");
}

main().catch(console.error);
