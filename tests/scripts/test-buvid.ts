import { setBilibiliCookie, bilibiliGet, pong } from "../src/crawl/bilibili/client.js";

async function getGuestCookies(): Promise<string> {
  console.log("Fetching Bilibili homepage to retrieve guest cookies...");
  const res = await fetch("https://www.bilibili.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const cookies: string[] = [];
  const setCookieHeaders = res.headers.getSetCookie();
  
  for (const c of setCookieHeaders) {
    const part = c.split(";")[0];
    cookies.push(part);
  }

  const cookieStr = cookies.join("; ");
  return cookieStr;
}

async function main() {
  try {
    const guestCookie = await getGuestCookies();
    setBilibiliCookie(guestCookie);

    console.log("\n1. Testing OLD non-WBI search API...");
    try {
      const searchRes = await bilibiliGet(
        "/x/web-interface/search/type",
        {
          search_type: "video",
          keyword: "IPTV",
          page: "1",
          page_size: "3",
          order: "totalrank",
        },
        false
      );
      const results = searchRes.result || [];
      console.log(`-> OLD Search success! Found ${results.length} items.`);
      if (results.length > 0) {
        console.log(`   Sample: ${results[0].bvid} - ${results[0].title}`);
      }
    } catch (err: any) {
      console.log(`-> OLD Search failed: ${err.message}`);
    }

    console.log("\n2. Testing NEW WBI search API...");
    try {
      const searchRes = await bilibiliGet(
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
      const results = searchRes.result || [];
      console.log(`-> NEW Search success! Found ${results.length} items.`);
    } catch (err: any) {
      console.log(`-> NEW Search failed: ${err.message}`);
    }

  } catch (err: any) {
    console.error("Test failed:", err.message);
  }
}

main().catch(console.error);
