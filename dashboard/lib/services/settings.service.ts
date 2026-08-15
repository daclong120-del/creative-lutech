/**
 * Service — System Settings
 * Phục vụ trang Cấu hình hệ thống (Settings).
 */
import { SettingsRepository } from "@/lib/repositories/settings.repo";
import { decryptSettings, encryptSettings } from "@/lib/utils/crypto";
import type { DbClient } from "@/lib/repositories/types";

export interface SanitizedSettings {
  use2Captcha: boolean;
  captchaApiKeyConfigured: boolean;
  captchaApiKeyPreview: string;
  collectComments: boolean;
  collectReplies: boolean;
  headlessMode: boolean;
  defaultPriority: string;
  maxConcurrentTasks: number;
  maxRetries: number;
  defaultWebhookUrlConfigured: boolean;
  defaultWebhookUrlPreview: string;
  notifyOnSuccess: boolean;
  alertOnFailure: boolean;
}

const DEFAULT_SETTINGS = {
  use_2captcha: true,
  api_key: null,
  collect_comments: true,
  collect_replies: true,
  headless_mode: true,
  default_priority: "normal",
  max_concurrent_tasks: 3,
  max_retries: 2,
  default_webhook_url: null,
  notify_on_success: true,
  alert_on_failure: true,
};

function maskApiKey(key: string | null | undefined): { captchaApiKeyConfigured: boolean; captchaApiKeyPreview: string } {
  if (!key) {
    return { captchaApiKeyConfigured: false, captchaApiKeyPreview: "" };
  }
  if (key.length <= 8) {
    return { captchaApiKeyConfigured: true, captchaApiKeyPreview: "****" };
  }
  return {
    captchaApiKeyConfigured: true,
    captchaApiKeyPreview: `${key.slice(0, 4)}...${key.slice(-4)}`
  };
}

function maskWebhookUrl(url: string | null | undefined): { defaultWebhookUrlConfigured: boolean; defaultWebhookUrlPreview: string } {
  if (!url) {
    return { defaultWebhookUrlConfigured: false, defaultWebhookUrlPreview: "" };
  }
  try {
    const parsed = new URL(url);
    const domain = parsed.host;
    const pathPart = parsed.pathname.length > 12 ? parsed.pathname.slice(0, 12) + "..." : parsed.pathname;
    return {
      defaultWebhookUrlConfigured: true,
      defaultWebhookUrlPreview: `${parsed.protocol}//${domain}${pathPart}`
    };
  } catch {
    return {
      defaultWebhookUrlConfigured: true,
      defaultWebhookUrlPreview: url.length > 15 ? `${url.slice(0, 15)}...` : "****"
    };
  }
}

/** Lấy cấu hình hệ thống đã che dấu các secret nhạy cảm */
export async function getSanitizedSettings(): Promise<SanitizedSettings> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const repo = new SettingsRepository(db as unknown as DbClient);
  
  const raw = await repo.get();
  const settings = raw || DEFAULT_SETTINGS;
  
  const decryptedKey = settings.api_key ? decryptSettings(settings.api_key) : null;
  const { captchaApiKeyConfigured, captchaApiKeyPreview } = maskApiKey(decryptedKey);

  const decryptedWebhook = settings.default_webhook_url ? decryptSettings(settings.default_webhook_url) : null;
  const { defaultWebhookUrlConfigured, defaultWebhookUrlPreview } = maskWebhookUrl(decryptedWebhook);

  return {
    use2Captcha: settings.use_2captcha,
    captchaApiKeyConfigured,
    captchaApiKeyPreview,
    collectComments: settings.collect_comments,
    collectReplies: settings.collect_replies,
    headlessMode: settings.headless_mode,
    defaultPriority: settings.default_priority,
    maxConcurrentTasks: settings.max_concurrent_tasks,
    maxRetries: settings.max_retries,
    defaultWebhookUrlConfigured,
    defaultWebhookUrlPreview,
    notifyOnSuccess: settings.notify_on_success,
    alertOnFailure: settings.alert_on_failure,
  };
}

/** Lấy cấu hình hệ thống thô bao gồm các secret đã giải mã (chỉ dùng phía Server) */
export async function getRawSettings(): Promise<{ apiKey: string | null; defaultWebhookUrl: string | null }> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const repo = new SettingsRepository(db as unknown as DbClient);
  
  const raw = await repo.get();
  const settings = raw || DEFAULT_SETTINGS;
  
  const decryptedKey = settings.api_key ? decryptSettings(settings.api_key) : null;
  const decryptedWebhook = settings.default_webhook_url ? decryptSettings(settings.default_webhook_url) : null;

  return {
    apiKey: decryptedKey,
    defaultWebhookUrl: decryptedWebhook
  };
}

/** Lưu cấu hình hệ thống từ payload client gửi lên */
export async function saveSettings(payload: {
  use2Captcha: boolean;
  apiKey?: string;
  collectComments: boolean;
  collectReplies: boolean;
  headlessMode: boolean;
  defaultPriority: string;
  maxConcurrentTasks: number;
  maxRetries: number;
  defaultWebhookUrl?: string;
  notifyOnSuccess: boolean;
  alertOnFailure: boolean;
}): Promise<void> {
  const { createClientServer } = await import("@/lib/supabase/server");
  const db = await createClientServer();
  const repo = new SettingsRepository(db as unknown as DbClient);

  const existing = await repo.get();

  let finalApiKey = existing?.api_key || null;
  // Chỉ cập nhật API key mới nếu user chủ động nhập khác trống
  if (payload.apiKey !== undefined && payload.apiKey !== "") {
    finalApiKey = encryptSettings(payload.apiKey);
  }

  let finalWebhookUrl = existing?.default_webhook_url || null;
  // Chỉ cập nhật Webhook mới nếu user chủ động nhập khác trống
  if (payload.defaultWebhookUrl !== undefined && payload.defaultWebhookUrl !== "") {
    finalWebhookUrl = encryptSettings(payload.defaultWebhookUrl);
  }

  await repo.upsert({
    use_2captcha: payload.use2Captcha,
    api_key: finalApiKey,
    collect_comments: payload.collectComments,
    collect_replies: payload.collectReplies,
    headless_mode: payload.headlessMode,
    default_priority: payload.defaultPriority,
    max_concurrent_tasks: payload.maxConcurrentTasks,
    max_retries: payload.maxRetries,
    default_webhook_url: finalWebhookUrl,
    notify_on_success: payload.notifyOnSuccess,
    alert_on_failure: payload.alertOnFailure,
  });
}

/** Lấy số dư tài khoản 2Captcha bằng API Key được lưu tại Server */
export async function get2CaptchaBalance(): Promise<number> {
  const { apiKey } = await getRawSettings();
  if (!apiKey) {
    throw new Error("Chưa cấu hình API Key cho 2Captcha.");
  }

  try {
    const res = await fetch(`https://2captcha.com/res.php?key=${apiKey}&action=getbalance&json=1`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      throw new Error(`2Captcha API HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data.status === 1) {
      return parseFloat(data.request);
    }
    throw new Error(data.request || "Không thể lấy số dư từ 2Captcha");
  } catch (error) {
    console.error("2Captcha balance fetch failed:", error);
    throw new Error((error as Error).message || "Lỗi khi kết nối với máy chủ 2Captcha");
  }
}
