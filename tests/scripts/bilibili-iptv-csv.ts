import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { bilibiliGet, setBilibiliCookie } from "../../crawler-pipeline/src/crawl/bilibili/client.js";

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

async function getGuestCookies(): Promise<string> {
  console.log("Fetching Bilibili homepage to retrieve guest cookies (buvid3)...");
  const res = await fetch("https://www.bilibili.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const cookies: string[] = [];
  const setCookieHeaders = res.headers.getSetCookie();
  
  for (const c of setCookieHeaders) {
    const part = c.split(";")[0];
    cookies.push(part);
  }

  const cookieStr = cookies.join("; ");
  console.log("Retrieved guest cookies:", cookieStr);
  return cookieStr;
}

async function main() {
  console.log("=============================================================");
  console.log("⚽ CRAWLING IPTV PLAYER CREATIVES FROM BILIBILI (GUEST MODE)");
  console.log("=============================================================\n");

  const guestCookie = await getGuestCookies();
  setBilibiliCookie(guestCookie);

  console.log("Sleeping 5 seconds to let guest session settle before crawl...");
  await new Promise(r => setTimeout(r, 5000));

  const rows: any[] = [];
  const keywords = ["IPTV", "电视播放器", "电视直播 software", "网络电视直播", "网络电视播放器", "IPTV直播源"];
  // Note: the original keyword "电视直播软件" is translated/used, but Bilibili might block some queries.
  // We use the exact keywords:
  const targetKeywords = ["IPTV", "电视播放器", "电视直播软件", "网络电视直播", "网络电视播放器", "IPTV直播源"];
  const limit = parseInt(process.argv[2] || "300", 10);
  
  const gatheredIds = new Set<string>();

  // Check if existing CSV exists to resume
  const localCsvPath = join(process.cwd(), "scratch", "iptv_player_creatives_bilibili.csv");
  if (existsSync(localCsvPath)) {
    try {
      const content = await readFile(localCsvPath, "utf8");
      const csvRows = parseCsvContent(content);
      // Skip header row
      for (let i = 1; i < csvRows.length; i++) {
        const parts = csvRows[i];
        if (parts.length >= 11) {
          const row = {
            index: rows.length + 1, // Re-index sequentially
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
      console.log(`Loaded ${rows.length} existing rows from ${localCsvPath} to resume.`);
    } catch (err: any) {
      console.warn(`Failed to parse existing CSV to resume: ${err.message}. Starting fresh.`);
    }
  }

  console.log(`\nStarting sequential search for keywords: ${JSON.stringify(targetKeywords)} (limit: ${limit})...`);

  for (const kw of targetKeywords) {
    if (rows.length >= limit) {
      break;
    }

    console.log(`\n--- Sleeping 8 seconds before searching keyword: "${kw}" ---`);
    await new Promise(r => setTimeout(r, 8000));
    
    let page = 1;

    while (rows.length < limit) {
      console.log(`Fetching page ${page} for keyword "${kw}"...`);
      
      let res: any;
      try {
        // Use non-WBI search type API for guest search
        res = await bilibiliGet(
          "/x/web-interface/search/type",
          {
            search_type: "video",
            keyword: kw,
            page: String(page),
            page_size: "20",
            order: "totalrank",
          },
          false
        );
      } catch (err: any) {
        console.error(`Error searching page ${page}: ${err.message}`);
        break;
      }

      const resultList = res.result || [];
      console.log(`-> Received ${resultList.length} items from page ${page}.`);

      if (resultList.length === 0) {
        console.log(`No more search results returned for keyword "${kw}".`);
        break;
      }

      for (const item of resultList) {
        if (rows.length >= limit) {
          break;
        }

        const bvid = item.bvid;
        if (!bvid) {
          continue;
        }

        // Avoid duplicate videos
        if (gatheredIds.has(bvid)) {
          continue;
        }
        gatheredIds.add(bvid);

        console.log(`[${rows.length + 1}/${limit}] Fetching detail for video ID: ${bvid}...`);
      
        try {
          // Use non-WBI view API for guest detail extraction
          const view = await bilibiliGet("/x/web-interface/view", { bvid }, false);
          if (!view) {
            console.warn(`Warning: video detail returned invalid data for ID: ${bvid}`);
            continue;
          }

          const owner = view.owner || {};
          const stat = view.stat || {};

          rows.push({
            index: rows.length + 1,
            aweme_id: bvid,
            desc: view.desc || view.title || "",
            author_nickname: owner.name || "",
            author_sec_uid: String(owner.mid || ""),
            create_time: view.pubdate ? new Date(view.pubdate * 1000).toISOString() : "",
            digg_count: stat.like ?? 0,
            comment_count: stat.reply ?? 0,
            share_count: stat.share ?? 0,
            play_count: stat.view ?? 0,
            url: `https://www.bilibili.com/video/${bvid}`
          });
        } catch (err: any) {
          console.error(`Failed to fetch detail for video ${bvid}: ${err.message}`);
        }

        // Respectful sleep to avoid hitting rate limits
        await new Promise(r => setTimeout(r, 1500));
      }

      console.log("Sleeping 5 seconds before fetching next page...");
      await new Promise(r => setTimeout(r, 5000));
      page++;
    }
  }

  console.log(`\nSuccessfully gathered ${rows.length} rows.`);

  if (rows.length === 0) {
    console.error("❌ No data gathered. CSV will not be written.");
    process.exit(1);
  }

  // Format to CSV
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

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
  const rootCsvPath = join(process.cwd(), "..", "scratch", "iptv_player_creatives_bilibili.csv");

  console.log(`Writing CSV to: ${localCsvPath}`);
  await writeFile(localCsvPath, csvContent, "utf8");

  try {
    await writeFile(rootCsvPath, csvContent, "utf8");
    console.log(`Writing CSV to: ${rootCsvPath}`);
  } catch (err: any) {
    console.error(`Warning: Failed to write to root CSV path: ${err.message}`);
  }

  console.log("\n=============================================================");
  console.log("🎉 SUCCESS: CSV file generated successfully!");
  console.log(`Path: ${rootCsvPath}`);
  console.log("=============================================================");
}

main().catch(async (err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
