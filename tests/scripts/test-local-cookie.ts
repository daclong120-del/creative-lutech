import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "crypto";
import { setBilibiliCookie, pong, bilibiliGet } from "../src/crawl/bilibili/client.js";

async function fetchWebTicket(csrf: string): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const key = "XgwSnGZ1p";
  const message = `ts${ts}`;
  const hexsign = crypto.createHmac("sha256", key).update(message).digest("hex");

  const url = `https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket?key_id=ec02&hexsign=${hexsign}&context[ts]=${ts}&csrf=${csrf}`;
  console.log(`Generating web ticket from Bilibili API...`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.bilibili.com/"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to generate web ticket, HTTP ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  if (data.code !== 0) {
    throw new Error(`GenWebTicket API returned code ${data.code}: ${data.message}`);
  }

  return data.data.ticket;
}

async function main() {
  const localContent = readFileSync(join(process.cwd(), "output", "bilibili_session.json"), "utf8");
  const localCookieStr = JSON.parse(localContent).cookie || "";

  // Parse csrf (bili_jct)
  const matchJct = localCookieStr.match(/bili_jct=([^;]+)/);
  const csrf = matchJct ? matchJct[1].trim() : "";
  console.log("Found CSRF (bili_jct):", csrf);

  // Fetch new ticket
  const ticket = await fetchWebTicket(csrf);
  console.log("Successfully generated new web ticket:", ticket.substring(0, 30) + "...");

  // Update bili_ticket in localCookieStr
  let updated = localCookieStr;
  if (updated.includes("bili_ticket=")) {
    updated = updated.replace(/bili_ticket=[^;]+/, `bili_ticket=${ticket}`);
  } else {
    updated += `; bili_ticket=${ticket}`;
  }

  // Update bili_ticket_expires
  const expiresTimestamp = Math.floor(Date.now() / 1000) + 72 * 3600;
  if (updated.includes("bili_ticket_expires=")) {
    updated = updated.replace(/bili_ticket_expires=[^;]+/, `bili_ticket_expires=${expiresTimestamp}`);
  } else {
    updated += `; bili_ticket_expires=${expiresTimestamp}`;
  }

  setBilibiliCookie(updated);
  console.log("Checking active status with refreshed ticket...");
  const active = await pong();
  console.log("Pong status:", active ? "ACTIVE (isLogin: true)" : "EXPIRED/INVALID");

  if (active) {
    console.log("Testing search query...");
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
    console.log(`-> Search success! Found ${results.length} items.`);
    if (results.length > 0) {
      console.log(`   Sample: ${results[0].bvid} - ${results[0].title}`);
    }
  }
}

main().catch(console.error);
