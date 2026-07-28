import { readFileSync } from "node:fs";
import { join } from "node:path";
import { setBilibiliCookie, pong } from "../src/crawl/bilibili/client.js";

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

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`Querying Supabase directly at ${url}...`);

  const res = await fetch(`${url}/rest/v1/crawler_accounts?platform=eq.bilibili&status=eq.active`, {
    headers: {
      "x-api-key": key || "",
      "Authorization": `Bearer ${key}`
    }
  });

  if (!res.ok) {
    console.error("HTTP error:", res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log("Total active Bilibili accounts in DB:", data.length);
  if (data.length > 0) {
    const acct = data[0];
    console.log(`Testing account username: ${acct.username}...`);
    setBilibiliCookie(acct.cookie_data);
    const ok = await pong();
    console.log(`Pong status: ${ok ? "ACTIVE" : "EXPIRED/INVALID"}`);
  } else {
    console.log("No active Bilibili accounts in DB.");
  }
}

main().catch(console.error);
