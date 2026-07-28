import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(p: string) {
  try {
    const content = fs.readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { }
}

loadEnv(path.resolve(__dirname, "../.env.local"));
loadEnv(path.resolve(__dirname, "../../.env"));
loadEnv(path.resolve(__dirname, "../../supabase/.env.local"));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

  const rawToken = process.env.WORKER_API_TOKEN_TO_INSERT;

  if (!rawToken) {
    throw new Error("Missing WORKER_API_TOKEN_TO_INSERT.");
  }
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Check if already exists
  const { data: existing } = await supabase.from("api_tokens").select("id").eq("token_hash", tokenHash).single();
  if (existing) {
    console.log("Token already exists.");
    return;
  }

  const tokenPrefix = rawToken.substring(0, 16);

  const { error } = await supabase.from("api_tokens").insert({
    name: "Worker Test Token",
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    role_id: "admin",
    created_by: userId,
    status: "active",
    scopes: [
      "crawler:claim", "crawler:write_logs", "crawler:read_task", "crawler:update_task",
      "crawler:read_accounts", "crawler:update_accounts", "crawler:write_accounts",
      "crawler:read_data", "crawler:write_data", "crawler:update_data"
    ]
  });

  if (error) {
    console.error("Failed to insert token:", error);
  } else {
    console.log(`Test token ${tokenPrefix}... inserted successfully!`);
  }
}

main();
