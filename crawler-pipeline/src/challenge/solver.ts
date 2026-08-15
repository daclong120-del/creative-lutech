import { ICaptchaSolver, SolverConfig } from "./types.js";
import { TwoCaptchaProvider } from "./providers/two_captcha.js";

/**
 * # Factory khởi tạo Captcha Solver tương ứng với cấu hình hệ thống
 */
export class ChallengeSolverFactory {
  static create(config?: Partial<SolverConfig>): ICaptchaSolver | null {
    const enabled = process.env.CAPTCHA_ENABLED === "true";
    if (!enabled && !config?.provider) {
      console.log("[SolverFactory] CAPTCHA_ENABLED is false. Solver is disabled.");
      return null;
    }

    const provider = config?.provider || (process.env.CAPTCHA_PROVIDER as any) || "2captcha";
    const apiKey = config?.apiKey || process.env.TWOCAPTCHA_API_KEY || "";
    const timeoutMs = config?.timeoutMs || (process.env.CAPTCHA_TIMEOUT_MS ? parseInt(process.env.CAPTCHA_TIMEOUT_MS, 10) : 120000);

    if (provider === "2captcha") {
      if (!apiKey) {
        console.warn("[SolverFactory] CAPTCHA_ENABLED is true, but TWOCAPTCHA_API_KEY is missing.");
        return null;
      }
      return new TwoCaptchaProvider(apiKey, timeoutMs);
    }

    console.warn(`[SolverFactory] Unsupported provider: ${provider}`);
    return null;
  }
}
