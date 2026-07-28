import { readFileSync } from "node:fs";
import { join } from "node:path";

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

function getEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const CONFIG = {
  supabase: {
    url: getEnv("INTERNAL_API_URL") ?? (() => { throw new Error("Thiếu biến INTERNAL_API_URL — vui lòng cấu hình trong file .env để kết nối qua Token Guard"); })(),
    apiToken: getEnv("API_TOKEN") ?? (() => { throw new Error("Thiếu biến API_TOKEN — vui lòng cấu hình token trong file .env để bảo mật runtime"); })(),
  },
  proxy: getEnv("CRAWLER_PROXY") ?? "",
  headless: getEnv("CRAWLER_HEADLESS") !== "false",
  supermiumPath: getEnv("SUPERMIUM_PATH") ?? getEnv("BROWSER_EXECUTABLE_PATH") ?? "C:\\Program Files\\Supermium\\chrome.exe",
};

