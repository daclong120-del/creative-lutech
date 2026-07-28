import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

function parseCsvContent(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.length > 0 && currentRow.some(f => f !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      if (char === '\r' && text[i + 1] === '\n') {
        i++; // skip LF after CR
      }
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  
  return rows;
}

const escapeCsv = (val: any) => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

async function main() {
  console.log("=============================================================");
  console.log("🚀 PLAYWRIGHT-BASED CRAWLER FOR IPTV CREATIVES");
  console.log("=============================================================\n");

  const rows: any[] = [];
  const gatheredIds = new Set<string>();
  const limit = parseInt(process.argv[2] || "500", 10);
  const keywords = ["IPTV", "APTV", "TiviMate", "M3U8播放器", "iPlayTV", "Kodi", "电视盒子软件"];

  // Load existing items to resume
  const localCsvPath = join(process.cwd(), "scratch", "iptv_player_creatives_douyin.csv");
  if (existsSync(localCsvPath)) {
    try {
      const content = await readFile(localCsvPath, "utf8");
      const csvRows = parseCsvContent(content);
      for (let i = 1; i < csvRows.length; i++) {
        const parts = csvRows[i];
        if (parts.length >= 11) {
          const row = {
            index: rows.length + 1,
            aweme_id: parts[1],
            desc: parts[2],
            author_nickname: parts[3],
            author_sec_uid: parts[4],
            create_time: parts[5],
            digg_count: parseInt(parts[6] || "0", 10),
            comment_count: parseInt(parts[7] || "0", 10),
            share_count: parseInt(parts[8] || "0", 10),
            play_count: parseInt(parts[9] || "0", 10),
            url: parts[10]
          };
          rows.push(row);
          gatheredIds.add(row.aweme_id);
        }
      }
      console.log(`Loaded ${rows.length} existing rows from CSV to resume.`);
    } catch (err: any) {
      console.warn(`Failed to parse existing CSV: ${err.message}`);
    }
  }

  if (rows.length >= limit) {
    console.log(`Target limit of ${limit} already reached. Exiting.`);
    return;
  }

  // Launch Playwright browser
  const profileDir = join(process.cwd(), "output", "browser-profiles", "douyin-default");
  console.log(`Launching Chromium with persistent profile at: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false, // run headful to avoid bot fingerprint blocks
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  // Bypass webdriver detection!
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });

  const page = await context.newPage();

  console.log("Pre-navigating to Douyin homepage to establish session state...");
  await page.goto("https://www.douyin.com/");
  await page.waitForTimeout(6000);

  // Array to temporarily hold results from response intercepts
  let newItemsQueue: any[] = [];

  // Listen to network responses to capture search results
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/general/search/")) {
      try {
        const json = await response.json();
        const data = json.data ?? [];
        console.log(`[Intercept] Captured search page response with ${data.length} items from URL: ${url}`);
        for (const item of data) {
          const info = item.aweme_info ?? item.aweme_mix_info?.mix_items?.[0];
          if (info?.aweme_id && !gatheredIds.has(info.aweme_id)) {
            newItemsQueue.push(info);
          }
        }
      } catch (err: any) {
        console.warn(`[Intercept] Warning: Failed to parse search response from ${url}: ${err.message}`);
      }
    }
  });

  for (const kw of keywords) {
    if (rows.length >= limit) break;

    console.log(`\n--- Searching keyword: "${kw}" ---`);
    
    // Only navigate to homepage on the very first search to establish session state
    if (page.url() === "about:blank") {
      console.log("Navigating to homepage to establish session state...");
      await page.goto("https://www.douyin.com/");
      await page.waitForTimeout(6000);
    }

    console.log(`Locating search input and typing keyword: "${kw}"...`);
    const searchInput = page.locator('input[placeholder*="搜索"], input[data-e2e="search-input"]').first();
    await searchInput.click();
    await searchInput.fill(kw);
    await page.waitForTimeout(1000);

    console.log("Pressing Enter to initiate search...");
    await searchInput.press("Enter");

    // Wait for search results to load and settle
    await page.waitForTimeout(10000);

    let noNewItemsCount = 0;
    let scrollCount = 0;

    while (rows.length < limit && noNewItemsCount < 5 && scrollCount < 15) {
      if (newItemsQueue.length > 0) {
        const batch = [...newItemsQueue];
        newItemsQueue = [];
        noNewItemsCount = 0;

        console.log(`Processing ${batch.length} new items from intercept queue...`);
        for (const info of batch) {
          if (rows.length >= limit) break;
          if (gatheredIds.has(info.aweme_id)) continue;
          gatheredIds.add(info.aweme_id);

          console.log(`[${rows.length + 1}/${limit}] Fetching details for video ID: ${info.aweme_id}`);

          // Fetch detail by executing fetch inside the browser page context
          try {
            const detail = await page.evaluate(async (id) => {
              const res = await fetch(`https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id=${id}&device_platform=webapp&aid=6383`);
              return res.json();
            }, info.aweme_id);

            const aweme = detail?.aweme_detail;
            if (aweme?.aweme_id) {
              rows.push({
                index: rows.length + 1,
                aweme_id: aweme.aweme_id,
                desc: aweme.desc || "",
                author_nickname: aweme.author?.nickname || "",
                author_sec_uid: aweme.author?.sec_uid || "",
                create_time: aweme.create_time ? new Date(aweme.create_time * 1000).toISOString() : "",
                digg_count: aweme.statistics?.digg_count ?? 0,
                comment_count: aweme.statistics?.comment_count ?? 0,
                share_count: aweme.statistics?.share_count ?? 0,
                play_count: aweme.statistics?.play_count ?? 0,
                url: `https://www.douyin.com/video/${aweme.aweme_id}`
              });

              // Intermittent auto-save
              if (rows.length % 5 === 0) {
                await saveCsv(rows);
              }
            }
          } catch (err: any) {
            console.error(`Failed to fetch detail inside browser for ${info.aweme_id}: ${err.message}`);
          }

          await page.waitForTimeout(1500);
        }
      } else {
        noNewItemsCount++;
      }

      console.log(`Scrolling down to load next page (Scroll #${scrollCount + 1})...`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(4000);
      scrollCount++;
    }
  }

  await context.close();

  // Final save
  await saveCsv(rows);

  console.log("\n=============================================================");
  console.log("🎉 SUCCESS: Playwright search completed successfully!");
  console.log(`Total gathered: ${rows.length} rows`);
  console.log("=============================================================");
}

async function saveCsv(rows: any[]) {
  if (rows.length === 0) return;

  const csvHeader = ["index", "aweme_id", "desc", "author_nickname", "author_sec_uid", "create_time", "digg_count", "comment_count", "share_count", "play_count", "url"];
  const csvRows = [csvHeader.map(escapeCsv).join(",")];

  for (const row of rows) {
    const line = [
      row.index,
      row.aweme_id,
      row.desc,
      row.author_nickname,
      row.author_sec_uid,
      row.create_time,
      row.digg_count,
      row.comment_count,
      row.share_count,
      row.play_count,
      row.url
    ];
    csvRows.push(line.map(escapeCsv).join(","));
  }

  const csvContent = csvRows.join("\n");
  const localCsvPath = join(process.cwd(), "scratch", "iptv_player_creatives_douyin.csv");
  const rootCsvPath = join(process.cwd(), "..", "scratch", "iptv_player_creatives_douyin.csv");

  await writeFile(localCsvPath, csvContent, "utf8");
  try {
    await writeFile(rootCsvPath, csvContent, "utf8");
  } catch {}
}

main().catch(console.error);
