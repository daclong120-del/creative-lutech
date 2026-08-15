/**
 * # Interfaces & Types cho lớp Giải CAPTCHA / Anti-Bot Challenge
 */

export type CaptchaProviderType = "2captcha" | "manual";

export interface CaptchaPoint {
  x: number;
  y: number;
}

export interface CaptchaSolution {
  code?: string;
  xOffset?: number;
  points?: CaptchaPoint[];
  token?: string;
  text?: string;
  solveTimeMs?: number;
}

export interface SliderCaptchaTask {
  type: "slider";
  backgroundImageBase64: string;
  pieceImageBase64?: string;
  pageUrl?: string;
}

export interface ClickCaptchaTask {
  type: "click";
  imageBase64: string;
  instructions?: string;
  pageUrl?: string;
}

export interface TurnstileCaptchaTask {
  type: "turnstile";
  siteKey: string;
  pageUrl: string;
}

export type CaptchaTask = SliderCaptchaTask | ClickCaptchaTask | TurnstileCaptchaTask;

export interface ICaptchaSolver {
  solveSlider(task: SliderCaptchaTask): Promise<CaptchaSolution>;
  solveClick?(task: ClickCaptchaTask): Promise<CaptchaSolution>;
  solveTurnstile(task: TurnstileCaptchaTask): Promise<CaptchaSolution>;
  getBalance(): Promise<number>;
}

export interface SolverConfig {
  provider: CaptchaProviderType;
  apiKey?: string;
  timeoutMs?: number;
  maxAttempts?: number;
}
