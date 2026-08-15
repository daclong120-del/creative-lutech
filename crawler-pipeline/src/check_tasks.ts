import { CONFIG } from "./config.js";
import { logger } from "./utils/index.js";

async function main() {
  logger.info("Supabase URL: " + CONFIG.supabase.url, "DevCheck");
  
  // Test insert via RPC
  const rpcUrl = `${CONFIG.supabase.url}/rest/v1/rpc/create_crawler_tasks`;
  const testTasks = [
    {
      platform: "zhihu",
      command: "crawl",
      target: "https://www.zhihu.com/question/12345678",
      max_count: 10,
      priority: "normal"
    },
    {
      platform: "douyin",
      command: "crawl",
      target: "https://v.douyin.com/abcde123/",
      max_count: 20,
      priority: "high"
    }
  ];

  logger.info("Inserting test tasks...", "DevCheck");
  const insertRes = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "x-api-key": CONFIG.supabase.apiToken,
      "Authorization": `Bearer ${CONFIG.supabase.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_tasks: testTasks })
  });

  if (!insertRes.ok) {
    const text = await insertRes.text();
    logger.error(`Error inserting tasks: Status ${insertRes.status}. Response: ${text}`, "DevCheck");
    return;
  }

  const insertResult = await insertRes.json();
  logger.info("Insert result: " + JSON.stringify(insertResult), "DevCheck");

  // Read tasks back
  const url = `${CONFIG.supabase.url}/rest/v1/crawler_tasks?order=created_at.desc&limit=10`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": CONFIG.supabase.apiToken,
      "Authorization": `Bearer ${CONFIG.supabase.apiToken}`,
      "Content-Type": "application/json",
    }
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`Error fetching tasks: Status ${res.status}. Response: ${text}`, "DevCheck");
    return;
  }

  const data = await res.json();
  logger.info("Recent tasks in DB:", "DevCheck");
  logger.info(JSON.stringify(data, null, 2), "DevCheck");
}

main().catch((err) => logger.error("Main execution failed: " + err.message, "DevCheck"));
