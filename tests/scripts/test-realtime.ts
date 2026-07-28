import { createClient } from "@supabase/supabase-js";
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
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin_test@sinomedia.vn";
const adminPassword = process.env.TEST_ADMIN_PASSWORD || "testpassword123";

async function main() {
  console.log("Supabase URL:", SUPABASE_URL);

  // Create client with anon key, similar to browser
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  if (authError) {
    console.error("Login failed:", authError);
    process.exit(1);
  }

  console.log("Logged in successfully. User ID:", authData.user.id);

  // Subscribe to realtime
  const channel = supabase
    .channel("test-tasks")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "crawler_tasks" },
      (payload) => {
        console.log("Realtime INSERT received!");
        console.log("Payload new:", JSON.stringify(payload.new, null, 2));
      }
    )
    .subscribe((status, err) => {
      console.log("Realtime subscription status:", status, err || "");
      if (status === "SUBSCRIBED") {
        console.log("Realtime subscribed. Inserting a test task now...");
        insertTask();
      }
    });

  async function insertTask() {
    const { data, error } = await supabase
      .from("crawler_tasks")
      .insert({
        platform: "douyin",
        command: "search",
        target: "realtime_test_" + Date.now(),
        status: "pending",
        priority: "normal"
      })
      .select();

    if (error) {
      console.error("Insert failed:", error);
    } else {
      console.log("Insert successful. Row in DB:", JSON.stringify(data, null, 2));
    }
  }

  // Keep alive for 10 seconds to receive event
  await new Promise(resolve => setTimeout(resolve, 10000));
  channel.unsubscribe();
  console.log("Done.");
}

main();
