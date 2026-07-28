import { setBilibiliCookie, bilibiliGet } from "../src/crawl/bilibili/client.js";

async function getGuestCookies(): Promise<string> {
  const res = await fetch("https://www.bilibili.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  const cookies: string[] = [];
  const setCookieHeaders = res.headers.getSetCookie();
  for (const c of setCookieHeaders) {
    cookies.push(c.split(";")[0]);
  }
  return cookies.join("; ");
}

async function main() {
  const guestCookie = await getGuestCookies();
  setBilibiliCookie(guestCookie);
  const bvid = "BV1Eq7AziEyd";
  const view = await bilibiliGet("/x/web-interface/view", { bvid }, false);
  console.log("Keys in view response:", Object.keys(view));
  console.log("view.bvid:", view.bvid);
  console.log("view.desc:", view.desc);
  console.log("view.pubdate:", view.pubdate, new Date(view.pubdate * 1000).toISOString());
  console.log("view.owner:", view.owner);
  console.log("view.stat:", view.stat);
}

main().catch(console.error);
