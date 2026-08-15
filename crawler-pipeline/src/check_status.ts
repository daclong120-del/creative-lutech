import { CONFIG } from "./config.js";
import { logger } from "./utils/index.js";

async function main() {
  const url = `${CONFIG.supabase.url}/rest/v1/crawler_tasks?order=created_at.desc&limit=5&select=id,platform,command,target,status,error_message`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": CONFIG.supabase.apiToken,
      Authorization: `Bearer ${CONFIG.supabase.apiToken}`,
    },
  });
  const data = await res.json();
  logger.info(JSON.stringify(data, null, 2), "DevCheck");
}

main().catch((err) => logger.error("Main execution failed: " + err.message, "DevCheck"));
