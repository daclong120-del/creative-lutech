import { existsSync } from "node:fs";
import { CONFIG } from "../config.js";

/**
 * # Lấy đường dẫn file thực thi của Supermium / Browser
 * Thử lần lượt:
 * 1. `customPath` nếu được truyền vào và file tồn tại
 * 2. Biến môi trường SUPERMIUM_PATH / BROWSER_EXECUTABLE_PATH từ `CONFIG.supermiumPath`
 * 3. Các đường dẫn mặc định của Supermium trên Windows:
 *    - `C:\Program Files\Supermium\chrome.exe`
 *    - `C:\Program Files (x86)\Supermium\chrome.exe`
 */
export function getSupermiumExecutablePath(customPath?: string): string | undefined {
  if (customPath && existsSync(customPath)) {
    return customPath;
  }

  const envPath = CONFIG.supermiumPath;
  if (envPath && existsSync(envPath)) {
    return envPath;
  }

  const defaultPaths = [
    "C:\\Program Files\\Supermium\\chrome.exe",
    "C:\\Program Files (x86)\\Supermium\\chrome.exe"
  ];

  for (const path of defaultPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return undefined;
}
