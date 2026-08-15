import { join } from "node:path";
import { chromium } from "playwright";
import { DouyinSession, isValidDouyinWebId } from "./session.js";
import { getWebId } from "./http_client.js";
import { getSupermiumExecutablePath } from "../../utils/browser.js";

export interface BootstrapOptions {
  profileDir?: string;
  executablePath?: string;
  headless?: boolean;
  rawCookies?: any[];
  rawWebId?: string;
  rawMsToken?: string;
  rawVerifyFp?: string;
  timeoutMs?: number;
}

/**
 * # Khởi chạy Browser và làm giàu (enrich) session bằng Playwright Persistent Context
 */
export async function bootstrapDouyinSession(options: BootstrapOptions = {}): Promise<DouyinSession> {
  const profileDir = options.profileDir || join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const headless = options.headless === true;
  const timeoutMs = options.timeoutMs || 30000;
  const execPath = getSupermiumExecutablePath(options.executablePath);

  if (execPath) {
    console.log(`[Bootstrap] Using Supermium Browser binary at: ${execPath}`);
  } else {
    console.log(`[Bootstrap] Launching Chromium Persistent Context at: ${profileDir} (headless: ${headless})`);
  }

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: execPath,
    headless,
    viewport: { width: 1920, height: 1080 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage"
    ]
  });

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    let capturedMsToken = "";

    // Lắng nghe các yêu cầu mạng để bắt msToken từ tham số truy vấn
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("msToken=")) {
        try {
          const urlObj = new URL(url);
          const token = urlObj.searchParams.get("msToken");
          if (token && token.length > 20) {
            capturedMsToken = token;
          }
        } catch {}
      }
    });

    // Lắng nghe các phản hồi mạng để bắt msToken từ set-cookie
    page.on("response", (res) => {
      try {
        const headers = res.headers();
        const setCookie = headers["set-cookie"];
        if (setCookie && setCookie.includes("msToken=")) {
          const match = setCookie.match(/msToken=([^;]+)/);
          if (match) {
            capturedMsToken = match[1];
          }
        }
      } catch {}
    });

    // 1. Nạp cookies thô vào context trước nếu có
    if (options.rawCookies && options.rawCookies.length > 0) {
      console.log(`[Bootstrap] Injecting ${options.rawCookies.length} raw cookies into browser context...`);
      // Standardize cookies for Playwright format
      const formattedCookies = options.rawCookies.map((c: any) => ({
        name: c.name,
        value: c.value,
        domain: c.domain.startsWith(".") ? c.domain : `.${c.domain}`,
        path: c.path || "/",
        secure: c.secure !== false,
        httpOnly: c.httpOnly === true,
        expires: c.expirationDate || c.expires || -1
      }));
      await context.addCookies(formattedCookies);
    }

    // 1. Điều hướng đến Douyin
    console.log("[Bootstrap] Navigating to https://www.douyin.com ...");
    await page.goto("https://www.douyin.com", { waitUntil: "domcontentloaded", timeout: options.timeoutMs || 45000 });
    await page.waitForTimeout(2000);

    let title = await page.title();
    if (title.includes("验证") || title.includes("Captcha")) {
      console.log("\n==========================================================================");
      console.log("⚠️ DOUYIN YÊU CẦU GIẢI CAPTCHA / XÁC MINH (验证码中间页)!");
      console.log("👉 Vui lòng thao tác kéo slider captcha trên cửa sổ trình duyệt đang mở để vượt qua verification.");
      console.log("==========================================================\n");

      let retries = 0;
      while ((title.includes("验证") || title.includes("Captcha")) && retries < 30) {
        await page.waitForTimeout(2000);
        title = await page.title();
        retries++;
      }

      if (title.includes("验证") || title.includes("Captcha")) {
        console.warn("⚠️ Hết thời gian chờ giải captcha. Tiếp tục thử trích xuất token...");
      } else {
        console.log("✅ Giải Captcha thành công! Trình duyệt đã hết bị khóa.");
      }
    }

    console.log("[Bootstrap] Navigating to search page to hydrate search stream tokens...");
    try {
      await page.goto("https://www.douyin.com/search/girl?type=general", { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(3000);
    } catch {
      console.log("[Bootstrap] Search navigation completed or timed out, continuing...");
    }
    await page.waitForTimeout(5000);

    // 2. Trích xuất thông tin
    console.log("[Bootstrap] Extracting session details from browser context...");
    const cookies = await context.cookies();

    const localStorage: Record<string, string> = await page.evaluate(() => {
      const store: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) store[key] = window.localStorage.getItem(key) || "";
      }
      return store;
    });

    const userAgent = await page.evaluate(() => navigator.userAgent);
    const platform = await page.evaluate(() => navigator.platform);
    const language = await page.evaluate(() => navigator.language);
    const screenWidth = await page.evaluate(() => screen.width);
    const screenHeight = await page.evaluate(() => screen.height);

    // 3. Phân tích các token cần thiết
    const cookieMap = new Map<string, string>();
    for (const c of cookies) {
      if (c && c.name) {
        cookieMap.set(c.name, c.value);
      }
    }

    console.log("[Bootstrap Debug] Cookies count:", cookies.length);
    console.log("[Bootstrap Debug] Cookie names:", Array.from(cookieMap.keys()).join(", "));
    console.log("[Bootstrap Debug] MONITOR_WEB_ID:", cookieMap.get("MONITOR_WEB_ID"));
    console.log("[Bootstrap Debug] __ac_webid:", cookieMap.get("__ac_webid"));
    console.log("[Bootstrap Debug] dy_did:", cookieMap.get("dy_did"));

    const webidCandidates = [
      cookieMap.get("webid"),
      cookieMap.get("__ac_webid"),
      cookieMap.get("dy_did"),
      cookieMap.get("MONITOR_WEB_ID"),
      options.rawWebId,
    ];
    let webid = webidCandidates.find(v => typeof v === "string" && isValidDouyinWebId(v)) || "";
    if (!webid) {
      webid = getWebId();
      console.log(`[Bootstrap] Generated fallback numeric webid: ${webid}`);
    }

    const msToken = capturedMsToken || localStorage.xmst || cookieMap.get("msToken") || options.rawMsToken || "";
    const xmst = localStorage.xmst || cookieMap.get("xmst") || "";
    const verifyFp = cookieMap.get("s_v_web_id") || options.rawVerifyFp || "";
    const fp = verifyFp;
    const uifid = cookieMap.get("UIFID") || cookieMap.get("UIFID_TEMP") || cookieMap.get("uifid") || "";

    // Parse Chrome version
    let browserVersion = "120.0.0.0";
    const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
    if (chromeMatch) {
      browserVersion = chromeMatch[1];
    }

    // Build standard cookie string
    const cookieString = cookies
      .filter((c: any) => c.name && c.name.trim() !== "")
      .map((c: any) => `${c.name}=${c.value}`)
      .join("; ");

    const session: DouyinSession = {
      cookies,
      cookieString,
      userAgent,
      msToken,
      xmst,
      webid,
      verifyFp,
      fp,
      uifid,
      browserName: "Chrome",
      browserVersion,
      browserPlatform: platform,
      browserLanguage: language,
      screenWidth,
      screenHeight,
      capturedAt: new Date().toISOString(),
      source: "playwright-persistent"
    };

    console.log("[Bootstrap] Session details enriched successfully!");
    return session;
  } finally {
    await context.close();
  }
}
