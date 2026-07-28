import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { createSessionFromRaw } from "../../crawler-pipeline/src/crawl/douyin/session.js";
import { runSessionDiagnostic } from "../../crawler-pipeline/src/crawl/douyin/session_diagnostic.js";
import { searchAweme, getAwemeDetail } from "../../crawler-pipeline/src/crawl/douyin/api.js";

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

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

function generateMsToken(length = 107): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let result = "";
  for (let i = 0; i < length - 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + "==";
}

function updateSessionMsToken(session: any, newToken: string) {
  session.msToken = newToken;
  if (session.cookies) {
    for (const c of session.cookies) {
      if (c.name === "msToken") {
        c.value = newToken;
      }
    }
  }
  if (session.cookies) {
    session.cookieString = session.cookies
      .filter((c: any) => c.name && c.name.trim() !== "")
      .map((c: any) => `${c.name}=${c.value}`)
      .join("; ");
  }
}

async function main() {
  console.log("=============================================================");
  console.log("⚽ CRAWLING IPTV PLAYER CREATIVES FROM DOUYIN (NO-DB TEST)");
  console.log("=============================================================\n");

  const cookiePath = join(process.cwd(), "scratch", "douyin_enriched_session.json");
  console.log(`Reading session from: ${cookiePath}`);

  let raw: any;
  try {
    const sessionContent = await readFile(cookiePath, "utf8");
    raw = JSON.parse(sessionContent);
  } catch (err: any) {
    console.error(`❌ Error reading or parsing scratch/douyin_enriched_session.json: ${err.message}`);
    console.log("Please make sure you have run the bootstrap script first:\n  npm run douyin:bootstrap");
    process.exit(1);
  }

  const session = createSessionFromRaw(raw, "scratch/cookie_doyin.json");

  console.log("\nRunning Session Diagnostic Gate...");
  const ok = await runSessionDiagnostic(session);
  if (!ok) {
    console.error("\n❌ ERROR: Douyin session diagnostic failed. Aborting search flow.");
    process.exit(1);
  }

  // Save back the enriched session containing any refreshed cookies
  try {
    await writeFile(cookiePath, JSON.stringify(session, null, 2), "utf8");
    console.log(`[Diagnostic] Refreshed cookies saved back to: ${cookiePath}`);
  } catch (err: any) {
    console.warn(`[Diagnostic] Warning: Failed to save updated session: ${err.message}`);
  }

  console.log("Sleeping 5 seconds to let session settle before cào thật...");
  await new Promise(r => setTimeout(r, 5000));

  const rows: any[] = [];
  const keywords = ["IPTV", "APTV", "TiviMate", "M3U8播放器", "iPlayTV", "Kodi", "电视盒子软件"];
  const limit = parseInt(process.argv[3] || "500", 10);
  
  const gatheredIds = new Set<string>();

  // Check if existing CSV exists to resume
  const localCsvPath = join(process.cwd(), "scratch", "iptv_player_creatives_douyin.csv");
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

  console.log(`\nStarting sequential search for keywords: ${JSON.stringify(keywords)} (limit: ${limit})...`);

  for (const kw of keywords) {
    if (rows.length >= limit) {
      break;
    }

    console.log(`\n--- Sleeping 8 seconds before searching keyword: "${kw}" ---`);
    await new Promise(r => setTimeout(r, 8000));
    
    let page = 0;
    let searchId = "";

    while (rows.length < limit) {
      const offset = page * 10;
      console.log(`Fetching page ${page + 1} (offset: ${offset}) for keyword "${kw}"...`);
      let res: any;
      try {
        res = await searchAweme(session, kw, offset, searchId);
      } catch (err: any) {
        console.error(`Error searching page ${page + 1}: ${err.message}`);
        break;
      }

      const data = res.data ?? [];
      console.log(`-> Received ${data.length} items from page ${page + 1}.`);

      if (data.length === 0) {
        console.log(`No more search results returned for keyword "${kw}".`);
        break;
      }

      searchId = res.extra?.logid ?? searchId;

      for (const item of data) {
        if (rows.length >= limit) {
          break;
        }

        const info = item.aweme_info ?? item.aweme_mix_info?.mix_items?.[0];
        if (!info?.aweme_id) {
          continue;
        }

        // Avoid duplicate videos
        if (gatheredIds.has(info.aweme_id)) {
          continue;
        }
        gatheredIds.add(info.aweme_id);

        console.log(`[${rows.length + 1}/${limit}] Fetching detail for video ID: ${info.aweme_id}...`);
      
        try {
          const detailRes = await getAwemeDetail(session, info.aweme_id);
          const aweme = detailRes.aweme_detail;
          if (!aweme?.aweme_id) {
            console.warn(`Warning: video detail returned invalid data for ID: ${info.aweme_id}`);
            continue;
          }

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
        } catch (err: any) {
          console.error(`Failed to fetch detail for video ${info.aweme_id}: ${err.message}`);
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
  const rootCsvPath = join(process.cwd(), "..", "scratch", "iptv_player_creatives_douyin.csv");

  console.log(`Writing CSV to: ${localCsvPath}`);
  await writeFile(localCsvPath, csvContent, "utf8");

  try {
    await writeFile(rootCsvPath, csvContent, "utf8");
    console.log(`Writing CSV to: ${rootCsvPath}`);
  } catch {}

  // Save back the enriched session containing any refreshed cookies
  try {
    await writeFile(cookiePath, JSON.stringify(session, null, 2), "utf8");
    console.log(`[Search] Final refreshed cookies saved back to: ${cookiePath}`);
  } catch (err: any) {
    console.warn(`[Search] Warning: Failed to save final session: ${err.message}`);
  }

  console.log("\n=============================================================");
  console.log("🎉 SUCCESS: CSV file generated successfully!");
  console.log(`Path: ${rootCsvPath}`);
  console.log("=============================================================");
}

main().catch(console.error);
