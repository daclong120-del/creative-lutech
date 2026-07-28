import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const token = "sm_live_1234567890abcdef";
  const url = "http://localhost:3000/api/worker/rest/v1/crawler_accounts?platform=eq.bilibili&status=eq.active&order=last_used_at.asc.nullsfirst&limit=1";
  
  console.log("Fetching from:", url);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": token,
        "Content-Type": "application/json"
      }
    });

    console.log("Status:", res.status);
    console.log("Headers:", JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    const text = await res.text();
    console.log("Response Body:", text);
  } catch (err: any) {
    console.error("Fetch failed with error:", err.message);
  }
}

main();
