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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const taskId = "9f047d60-9f4e-4d1c-bd67-290f075a199f";
  
  const { data: task, error: taskError } = await supabase
    .from("crawler_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (taskError) {
    console.error("Failed to fetch task:", taskError);
    process.exit(1);
  }

  console.log("=== Task Info ===");
  console.log("ID:", task.id);
  console.log("Platform:", task.platform);
  console.log("Command:", task.command);
  console.log("Target:", task.target);
  console.log("Status:", task.status);
  console.log("Error Message:", task.error_message);
  console.log("Updated At:", task.updated_at);

  const { data: logs, error: logsError } = await supabase
    .from("crawler_logs")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (logsError) {
    console.error("Failed to fetch logs:", logsError);
  } else {
    console.log("\n=== Task Logs ===");
    logs.forEach((log) => {
      console.log(`[${log.level}] ${log.message}`);
    });
  }
}

main();
