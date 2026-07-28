import { readFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "crypto";

function formatCookie(cookieStr: string): string {
  if (!cookieStr) return "";
  let trimmed = cookieStr.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const unescaped = JSON.parse(trimmed);
      if (typeof unescaped === "string") {
        trimmed = unescaped.trim();
      }
    } catch {}
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr
          .map((c: any) => {
            const name = c.name || c.key || "";
            const value = c.value || "";
            return name && value ? `${name}=${value}` : "";
          })
          .filter(Boolean)
          .join("; ");
      }
    } catch {}
  }
  return trimmed;
}

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
  const formatted = formatCookie(decrypted);
  console.log("Formatted Cookie Length:", formatted.length);
  console.log("Formatted Cookie:");
  console.log(formatted);
}

main().catch(console.error);
