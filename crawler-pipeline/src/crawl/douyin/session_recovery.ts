import { join } from "node:path";
import { chromium } from "playwright";
import { DouyinSession, createSessionFromRaw, isValidDouyinWebId } from "./session.js";
import { runSessionDiagnosticDetailed, DiagnosticResult } from "./session_diagnostic.js";
import { ChallengeSolverFactory } from "../../challenge/solver.js";
import { getWebId } from "./http_client.js";
import { getSupermiumExecutablePath } from "../../utils/browser.js";

export interface SearchApiResponse {
  status: number;
  verifyCheck: boolean;
  dataCount: number;
}

export interface RecoveryOptions {
  keyword?: string;
  reason?: string;
  accountId?: string;
  profileDir?: string;
  executablePath?: string;
  headless?: boolean;
  timeoutMs?: number;
  maxAttempts?: number;
}

export interface RecoveryResult {
  success: boolean;
  reason: string;
  session?: DouyinSession;
  diagnosticResult?: DiagnosticResult;
}

/**
 * # Phục hồi phiên Douyin khi gặp challenge / verify_check
 * State machine tương tác trình duyệt thật, lắng nghe Network API, giải 2Captcha nếu có UI, và xác minh lại qua Diagnostic.
 */
export async function recoverDouyinSession(
  currentSession: DouyinSession,
  options: RecoveryOptions = {}
): Promise<DouyinSession> {
  const result = await recoverDouyinSessionDetailed(currentSession, options);
  if (result.success && result.session) {
    return result.session;
  }
  throw new Error(`Session recovery failed: ${result.reason}`);
}

export async function recoverDouyinSessionDetailed(
  currentSession: DouyinSession,
  options: RecoveryOptions = {}
): Promise<RecoveryResult> {
  const keyword = options.keyword || "funny";
  const profileDir = options.profileDir || join(process.cwd(), "output", "browser-profiles", "douyin-default");
  const headless = options.headless !== undefined ? options.headless : false;
  const timeoutMs = options.timeoutMs || 45000;
  const execPath = getSupermiumExecutablePath(options.executablePath);

  console.log("\n=============================================================");
  console.log("🛠️ DOUYIN SESSION RECOVERY AUTOMATION STARTED");
  console.log(`- Keyword Target:    ${keyword}`);
  console.log(`- Trigger Reason:    ${options.reason || "challenge_required"}`);
  console.log(`- Profile Directory: ${profileDir}`);
  console.log(`- Headless Mode:     ${headless}`);
  if (execPath) {
    console.log(`- Browser Binary:    ${execPath} (Supermium)`);
  }
  console.log("=============================================================\n");

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
    const page = context.pages()[0] || await context.newPage();

    // 1. Nạp cookies hiện tại nếu có
    if (currentSession.cookies && currentSession.cookies.length > 0) {
      console.log(`[Recovery] Nạp ${currentSession.cookies.length} cookies vào browser context...`);
      const formattedCookies = currentSession.cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain.startsWith(".") ? c.domain : `.${c.domain}`,
        path: c.path || "/",
        secure: c.secure !== undefined ? c.secure : true,
        httpOnly: c.httpOnly !== undefined ? c.httpOnly : false,
        sameSite: (c.sameSite as any) || "Lax",
      }));
      await context.addCookies(formattedCookies);
    }

    let capturedVerifyCheck = false;

    // Lắng nghe Network API response của search endpoint
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/aweme/v1/web/general/search/stream/")) {
        try {
          const text = await response.text();
          const isVerify = text.includes("verify_check") || text.includes('"result_status":5');
          const hasData = text.includes('"aweme_info"') || text.includes('"aweme_id"');
          capturedVerifyCheck = isVerify;
          console.log(`[Recovery Network] Caught search stream response: HTTP ${response.status()}, verifyCheck=${isVerify}, hasData=${hasData}`);
        } catch {}
      }
    });

    // 2. Navigating to search page với keyword thực tế
    const targetUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}?type=general`;
    console.log(`[Recovery] Navigating to ${targetUrl} ...`);
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });
    await page.waitForTimeout(4000);

    let title = await page.title();
    console.log(`[Recovery] Current page title: "${title}"`);

    // 3. Kiểm tra Captcha Element / Interstitial UI
    const captchaSelector = ".captcha_verify_container, #captcha-verify-image, .secsdk-captcha-drag-icon, .captcha_verify_img_slide";
    let hasCaptchaElement = await page.$(captchaSelector).then(el => !!el).catch(() => false);
    const isCaptchaPage = title.includes("验证") || title.includes("Captcha");

    if (isCaptchaPage || hasCaptchaElement) {
      console.log("⚠️ Douyin hiển thị Captcha UI! Khởi chạy 2Captcha Solver...");
      const solver = ChallengeSolverFactory.create();

      if (solver) {
        try {
          const balance = await solver.getBalance();
          console.log(`[Recovery] Số dư 2Captcha khả dụng: $${balance} USD`);

          const bgImg = await page.$eval("#captcha-verify-image", (el: any) => el.src).catch(() => null);
          const pieceImg = await page.$eval(".captcha_verify_img_slide", (el: any) => el.src).catch(() => null);

          if (bgImg && bgImg.startsWith("data:image")) {
            const bgBase64 = bgImg.split(",")[1];
            const pieceBase64 = pieceImg && pieceImg.startsWith("data:image") ? pieceImg.split(",")[1] : undefined;

            console.log("[Recovery] Gửi ảnh Captcha Slider lên 2Captcha giải...");
            const solution = await solver.solveSlider({
              type: "slider",
              backgroundImageBase64: bgBase64,
              pieceImageBase64: pieceBase64,
              pageUrl: page.url(),
            });

            if (solution.xOffset && solution.xOffset > 0) {
              console.log(`[Recovery] Nhận tọa độ slider xOffset: ${solution.xOffset}px. Kéo slider...`);
              const sliderHandle = await page.$(".secsdk-captcha-drag-icon, .captcha_verify_slide_button");
              if (sliderHandle) {
                const box = await sliderHandle.boundingBox();
                if (box) {
                  const startX = box.x + box.width / 2;
                  const startY = box.y + box.height / 2;
                  await page.mouse.move(startX, startY);
                  await page.mouse.down();
                  await page.mouse.move(startX + solution.xOffset, startY, { steps: 15 });
                  await page.mouse.up();
                  console.log("[Recovery] Đã di chuyển chuột xong! Chờ 3 giây...");
                  await page.waitForTimeout(3000);
                }
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Recovery] 2Captcha solve error: ${err.message}`);
        }
      }

      // Manual fallback nếu vẫn còn captcha UI
      title = await page.title();
      hasCaptchaElement = await page.$(captchaSelector).then(el => !!el).catch(() => false);
      if (title.includes("验证") || title.includes("Captcha") || hasCaptchaElement) {
        console.log("\n👉 [Manual Fallback] Vui lòng kéo thanh trượt captcha trên cửa sổ trình duyệt...");
        let retries = 0;
        while ((title.includes("验证") || title.includes("Captcha") || hasCaptchaElement) && retries < 15) {
          await page.waitForTimeout(2000);
          title = await page.title();
          hasCaptchaElement = await page.$(captchaSelector).then(el => !!el).catch(() => false);
          retries++;
        }
      }
    } else if (capturedVerifyCheck) {
      console.warn("[Recovery] Search API trả về verify_check nhưng browser không render Captcha UI (challenge_not_rendered).");
    }

    // 4. Trích xuất browser session mới
    console.log("[Recovery] Trích xuất browser session mới...");
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
    const cookieMap = new Map<string, string>();
    for (const c of cookies) {
      if (c && c.name) cookieMap.set(c.name, c.value);
    }

    const webidCandidates = [
      cookieMap.get("webid"),
      cookieMap.get("__ac_webid"),
      cookieMap.get("dy_did"),
      cookieMap.get("MONITOR_WEB_ID"),
      currentSession.webid,
    ];
    let webid = webidCandidates.find(v => typeof v === "string" && isValidDouyinWebId(v)) || "";
    if (!webid) {
      webid = getWebId();
    }

    const msToken = localStorage.xmst || cookieMap.get("msToken") || currentSession.msToken || "";
    const verifyFp = cookieMap.get("s_v_web_id") || "";
    const uifid = cookieMap.get("UIFID") || cookieMap.get("UIFID_TEMP") || cookieMap.get("uifid") || "";

    const extractedData = {
      cookies,
      cookieString: cookies.map(c => `${c.name}=${c.value}`).join("; "),
      userAgent,
      webid,
      msToken,
      verifyFp,
      fp: verifyFp,
      uifid,
      browserName: "Chrome",
      browserVersion: "149.0.0.0",
      browserPlatform: "Win32",
      browserLanguage: "zh-CN",
      screenWidth: 1920,
      screenHeight: 1080,
      capturedAt: new Date().toISOString(),
      source: "session-recovery"
    };

    const extractedSession = createSessionFromRaw(extractedData, "session-recovery");
    console.log(`[Recovery] Extracted session: webid="${extractedSession.webid || "(none)"}", msToken=${extractedSession.msToken ? "YES" : "NO"}`);

    // 5. CHẠY DIAGNOSTIC KIỂM THỬ LẠI XÁC MINH SẠCH PHIÊN
    console.log("[Recovery] Chạy final diagnostic kiểm tra tính hợp lệ của recovered session...");
    const finalDiag = await runSessionDiagnosticDetailed(extractedSession);

    if (finalDiag.code === "ok") {
      console.log("✅ Recovery final diagnostic: ok");
      return {
        success: true,
        reason: "ok",
        session: extractedSession,
        diagnosticResult: finalDiag,
      };
    } else {
      const failReason = capturedVerifyCheck
        ? "browser_search_still_verify_check"
        : isCaptchaPage || hasCaptchaElement
        ? "solver_failed"
        : "challenge_not_rendered";

      console.error(`❌ Recovery final diagnostic FAILED: ${finalDiag.code} (Reason: ${failReason})`);
      return {
        success: false,
        reason: failReason,
        session: extractedSession,
        diagnosticResult: finalDiag,
      };
    }
  } finally {
    await context.close();
  }
}
