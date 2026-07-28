import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "crypto";
import { setBilibiliCookie, pong, bilibiliGet } from "../src/crawl/bilibili/client.js";

function loadEnv(path: string): void {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const index = trimmed.indexOf("=");
      if (index === -1) {
        continue;
      }
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {}
}

loadEnv(join(process.cwd(), ".env"));
loadEnv(join(process.cwd(), ".env.local"));

function getEncryptionKey(): Buffer {
  const keySecret = process.env.DB_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keySecret) {
    throw new Error("Missing DB_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY for encryption.");
  }
  return crypto.createHash("sha256").update(keySecret).digest();
}

function decrypt(text: string): string {
  if (!text) return text;
  const parts = text.split(":");
  if (parts.length !== 2) return text;
  try {
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err: any) {
    console.error("Decryption failed:", err.message);
    return text;
  }
}

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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/crawler_accounts?platform=eq.bilibili`, {
    headers: {
      "x-api-key": key || "",
      "Authorization": `Bearer ${key}`
    }
  });
  const data = await res.json();
  const rawCookie = data[0]?.cookie_data || "";
  
  const decrypted = decrypt(rawCookie);
  const cookieArr = JSON.parse(decrypted);

  // Find csrf (bili_jct)
  const csrfItem = cookieArr.find((c: any) => c.name === "bili_jct");
  const csrf = csrfItem ? csrfItem.value : "";
  console.log("Found CSRF (bili_jct):", csrf);

  // Fetch new ticket
  const ticket = await fetchWebTicket(csrf);
  console.log("Successfully generated new web ticket:", ticket.substring(0, 30) + "...");

  // Update cookie array with new ticket
  const updatedCookieArr = cookieArr.map((c: any) => {
    if (c.name === "bili_ticket") {
      return { ...c, value: ticket };
    }
    return c;
  });

  // Check if bili_ticket already exists in array; if not, add it
  if (!updatedCookieArr.some((c: any) => c.name === "bili_ticket")) {
    updatedCookieArr.push({
      name: "bili_ticket",
      value: ticket,
      domain: ".bilibili.com",
      path: "/"
    });
  }

  // Also update bili_ticket_expires
  const expiresTimestamp = Math.floor(Date.now() / 1000) + 72 * 3600; // 3 days
  const updatedCookieArrWithExpiry = updatedCookieArr.map((c: any) => {
    if (c.name === "bili_ticket_expires") {
      return { ...c, value: String(expiresTimestamp) };
    }
    return c;
  });
  if (!updatedCookieArrWithExpiry.some((c: any) => c.name === "bili_ticket_expires")) {
    updatedCookieArrWithExpiry.push({
      name: "bili_ticket_expires",
      value: String(expiresTimestamp),
      domain: ".bilibili.com",
      path: "/"
    });
  }

  const updatedCookieStr = JSON.stringify(updatedCookieArrWithExpiry, null, 2);

  // Set the Bilibili cookie
  setBilibiliCookie(updatedCookieStr);

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
