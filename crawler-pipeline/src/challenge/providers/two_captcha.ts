import { ICaptchaSolver, SliderCaptchaTask, TurnstileCaptchaTask, CaptchaSolution } from "../types.js";

/**
 * # Provider giải CAPTCHA tự động qua dịch vụ 2Captcha API
 */
export class TwoCaptchaProvider implements ICaptchaSolver {
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, timeoutMs = 120000) {
    if (!apiKey) {
      throw new Error("2Captcha API key is missing. Please set TWOCAPTCHA_API_KEY in .env");
    }
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  /**
   * # Lấy số dư tài khoản 2Captcha hiện tại ($ USD)
   */
  async getBalance(): Promise<number> {
    const url = `https://2captcha.com/res.php?key=${this.apiKey}&action=getbalance&json=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 1) {
      return parseFloat(data.request);
    }
    throw new Error(`2Captcha getBalance failed: ${data.request}`);
  }

  /**
   * # Giải Captcha Slider (Cắt ghép hình ảnh lấy tọa độ xOffset)
   */
  async solveSlider(task: SliderCaptchaTask): Promise<CaptchaSolution> {
    const startTime = Date.now();
    console.log("[2Captcha] Gửi ảnh Captcha Slider lên 2Captcha solver server...");

    // Submit task
    const params = new URLSearchParams();
    params.append("key", this.apiKey);
    params.append("method", "base64");
    params.append("body", task.backgroundImageBase64);
    if (task.pieceImageBase64) {
      params.append("imgfiles", task.pieceImageBase64);
    }
    params.append("coordinatescaptcha", "1");
    params.append("json", "1");

    const submitRes = await fetch("https://2captcha.com/in.php", {
      method: "POST",
      body: params,
    });
    const submitData = await submitRes.json();

    if (submitData.status !== 1) {
      throw new Error(`2Captcha task submit error: ${submitData.request}`);
    }

    const captchaId = submitData.request;
    console.log(`[2Captcha] Task đã tạo thành công, Captcha ID: ${captchaId}. Đang chờ giải...`);

    // Poll for result
    const pollInterval = 3000;
    const maxPolls = Math.floor(this.timeoutMs / pollInterval);

    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      const resUrl = `https://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${captchaId}&json=1`;
      const resultRes = await fetch(resUrl);
      const resultData = await resultRes.json();

      if (resultData.status === 1) {
        // Result format: "x=120,y=45" or raw text
        const solutionText = resultData.request;
        console.log(`[2Captcha] Nhận được kết quả thành công: ${solutionText}`);
        
        let xOffset = 0;
        const xMatch = solutionText.match(/x=(\d+)/i);
        if (xMatch) {
          xOffset = parseInt(xMatch[1], 10);
        } else if (/^\d+$/.test(solutionText.trim())) {
          xOffset = parseInt(solutionText.trim(), 10);
        }

        return {
          xOffset,
          text: solutionText,
          solveTimeMs: Date.now() - startTime,
        };
      }

      if (resultData.request !== "CAPCHA_NOT_READY") {
        throw new Error(`2Captcha solver error: ${resultData.request}`);
      }
    }

    throw new Error(`2Captcha timeout sau ${this.timeoutMs / 1000}s chờ kết quả giải.`);
  }

  /**
   * # Giải Captcha Click / Coordinates (Tọa độ điểm nhấp trên ảnh)
   */
  async solveClick(task: any): Promise<CaptchaSolution> {
    const startTime = Date.now();
    console.log("[2Captcha] Gửi ảnh Click Coordinates Captcha lên 2Captcha solver server...");

    const params = new URLSearchParams();
    params.append("key", this.apiKey);
    params.append("method", "base64");
    params.append("body", task.imageBase64);
    params.append("coordinatescaptcha", "1");
    if (task.instructions) {
      params.append("textinstructions", task.instructions);
    }
    params.append("json", "1");

    const submitRes = await fetch("https://2captcha.com/in.php", {
      method: "POST",
      body: params,
    });
    const submitData = await submitRes.json();

    if (submitData.status !== 1) {
      throw new Error(`2Captcha click submit error: ${submitData.request}`);
    }

    const captchaId = submitData.request;
    console.log(`[2Captcha] Click Task đã tạo thành công, Captcha ID: ${captchaId}. Đang chờ 2Captcha giải...`);

    const pollInterval = 3000;
    const maxPolls = Math.floor(this.timeoutMs / pollInterval);

    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      const resUrl = `https://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${captchaId}&json=1`;
      const resultRes = await fetch(resUrl);
      const resultData = await resultRes.json();

      if (resultData.status === 1) {
        const rawReq = resultData.request;
        const solutionText = typeof rawReq === "string" ? rawReq : JSON.stringify(rawReq);
        console.log(`[2Captcha] Nhận được kết quả tọa độ click: ${solutionText}`);

        const points: { x: number; y: number }[] = [];

        // Parse JSON array format: [{"x":"109","y":"155"},{"x":"279","y":"106"}]
        try {
          const parsed = typeof rawReq === "string" ? JSON.parse(rawReq) : rawReq;
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.x !== undefined && item.y !== undefined) {
                points.push({ x: parseInt(String(item.x), 10), y: parseInt(String(item.y), 10) });
              }
            }
          }
        } catch {}

        // Fallback parse string format: x=109,y=155
        if (points.length === 0 && typeof solutionText === "string") {
          const matches = solutionText.matchAll(/x=(\d+),y=(\d+)/gi);
          for (const m of matches) {
            points.push({ x: parseInt(m[1], 10), y: parseInt(m[2], 10) });
          }
        }

        return {
          points,
          text: solutionText,
          solveTimeMs: Date.now() - startTime,
        };
      }

      if (resultData.request !== "CAPCHA_NOT_READY") {
        throw new Error(`2Captcha Click solver error: ${resultData.request}`);
      }
    }

    throw new Error(`2Captcha Click timeout sau ${this.timeoutMs / 1000}s.`);
  }

  /**
   * # Giải Cloudflare Turnstile / HCaptcha
   */
  async solveTurnstile(task: TurnstileCaptchaTask): Promise<CaptchaSolution> {
    const startTime = Date.now();
    console.log(`[2Captcha] Gửi Turnstile sitekey ${task.siteKey} lên 2Captcha solver...`);

    const submitUrl = `https://2captcha.com/in.php?key=${this.apiKey}&method=turnstile&sitekey=${encodeURIComponent(task.siteKey)}&pageurl=${encodeURIComponent(task.pageUrl)}&json=1`;
    const submitRes = await fetch(submitUrl);
    const submitData = await submitRes.json();

    if (submitData.status !== 1) {
      throw new Error(`2Captcha Turnstile submit error: ${submitData.request}`);
    }

    const captchaId = submitData.request;
    const pollInterval = 5000;
    const maxPolls = Math.floor(this.timeoutMs / pollInterval);

    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      const resUrl = `https://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${captchaId}&json=1`;
      const resultRes = await fetch(resUrl);
      const resultData = await resultRes.json();

      if (resultData.status === 1) {
        return {
          token: resultData.request,
          solveTimeMs: Date.now() - startTime,
        };
      }

      if (resultData.request !== "CAPCHA_NOT_READY") {
        throw new Error(`2Captcha Turnstile solver error: ${resultData.request}`);
      }
    }

    throw new Error(`2Captcha Turnstile timeout sau ${this.timeoutMs / 1000}s.`);
  }
}
