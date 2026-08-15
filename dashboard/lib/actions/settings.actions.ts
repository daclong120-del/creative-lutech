"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/supabase/auth-helper";
import { verifyCSRF } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/services/system.service";
import * as settingsService from "@/lib/services/settings.service";

async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/** Server Action: Lấy cấu hình hệ thống đã che dấu API Key và Webhook */
export async function getSettingsAction() {
  await requireAdmin();
  return settingsService.getSanitizedSettings();
}

/** Server Action: Lưu cấu hình hệ thống */
export async function saveSettingsAction(payload: {
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
}) {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    const actor = await requireAdmin();

    // Whitelist payload validation
    const sanitizedPayload = {
      use2Captcha: Boolean(payload.use2Captcha),
      apiKey: typeof payload.apiKey === "string" ? payload.apiKey.trim() : "",
      collectComments: Boolean(payload.collectComments),
      collectReplies: Boolean(payload.collectReplies),
      headlessMode: Boolean(payload.headlessMode),
      defaultPriority: typeof payload.defaultPriority === "string" ? payload.defaultPriority : "normal",
      maxConcurrentTasks: Number(payload.maxConcurrentTasks) || 3,
      maxRetries: Number(payload.maxRetries) || 2,
      defaultWebhookUrl: typeof payload.defaultWebhookUrl === "string" ? payload.defaultWebhookUrl.trim() : "",
      notifyOnSuccess: Boolean(payload.notifyOnSuccess),
      alertOnFailure: Boolean(payload.alertOnFailure),
    };

    await settingsService.saveSettings(sanitizedPayload);

    // Ghi audit log
    const ipAddress = await getClientIp();
    await logAuditEvent({
      actor_id: actor.email,
      action: "save_system_settings",
      entity_type: "system_settings",
      entity_id: "default",
      payload: {
        use2Captcha: sanitizedPayload.use2Captcha,
        collectComments: sanitizedPayload.collectComments,
        collectReplies: sanitizedPayload.collectReplies,
        headlessMode: sanitizedPayload.headlessMode,
        defaultPriority: sanitizedPayload.defaultPriority,
        maxConcurrentTasks: sanitizedPayload.maxConcurrentTasks,
        maxRetries: sanitizedPayload.maxRetries,
        defaultWebhookUrlConfigured: sanitizedPayload.defaultWebhookUrl !== "",
        notifyOnSuccess: sanitizedPayload.notifyOnSuccess,
        alertOnFailure: sanitizedPayload.alertOnFailure,
        // Tuyệt đối không log api_key hoặc default_webhook_url thô vào audit logs
      },
      ip_address: ipAddress
    });

    revalidatePath("/dash/settings");
    return { success: true };
  } catch (err) {
    console.error("saveSettingsAction error:", err);
    return { error: err instanceof Error ? err.message : "Không thể lưu cấu hình hệ thống." };
  }
}

/** Server Action: Lấy số dư tài khoản 2Captcha thực tế từ server */
export async function get2CaptchaBalanceAction() {
  try {
    if (!(await verifyCSRF())) {
      return { error: "Xác thực bảo mật CSRF thất bại." };
    }
    await requireAdmin();
    const balance = await settingsService.get2CaptchaBalance();
    return { success: true, balance };
  } catch (err) {
    console.error("get2CaptchaBalanceAction error:", err);
    return { error: err instanceof Error ? err.message : "Lỗi kết nối với 2Captcha." };
  }
}
