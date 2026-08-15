import { getSelfProfile, searchAweme, getAwemeDetail } from "./api.js";
import { DouyinSession, isValidDouyinWebId } from "./session.js";

export type DiagnosticResultCode =
  | "ok"
  | "missing_identity"
  | "auth_expired"
  | "challenge_required"
  | "empty_search"
  | "network_error";

export interface DiagnosticResult {
  code: DiagnosticResultCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * # Chạy kiểm tra chuẩn đoán phiên trả về mã trạng thái chi tiết
 */
export async function runSessionDiagnosticDetailed(session: DouyinSession): Promise<DiagnosticResult> {
  try {
    console.log("[Diagnostic] Checkpoint 0: Kiểm tra sự hiện diện của các tham số định danh trình duyệt...");
    if (!session.webid || !isValidDouyinWebId(session.webid)) {
      const msg = `Checkpoint 0 thất bại: webid thiếu hoặc sai định dạng (WebId hiện tại: "${session.webid || "(empty)"}"). Yêu cầu numeric webid 16-22 chữ số.`;
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "missing_identity", message: msg };
    }
    if (!session.cookieString) {
      const msg = "Checkpoint 0 thất bại: Thiếu cookieString trong session.";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "missing_identity", message: msg };
    }
    if (!session.userAgent) {
      const msg = "Checkpoint 0 thất bại: Thiếu userAgent trong session.";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "missing_identity", message: msg };
    }
    if (!session.msToken) {
      const msg = "Checkpoint 0 thất bại: Thiếu msToken trong session.";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "missing_identity", message: msg };
    }

    if (!session.verifyFp) {
      console.warn("[Diagnostic] Checkpoint 0 Cảnh báo: Thiếu verifyFp/s_v_web_id trong session.");
    }
    if (!session.uifid) {
      console.warn("[Diagnostic] Checkpoint 0 Cảnh báo: Thiếu uifid/UIFID trong session.");
    }
    console.log("[Diagnostic] Checkpoint 0 thành công. Đầy đủ tham số định danh quan trọng.");

    console.log("[Diagnostic] Checkpoint 1: Gọi getSelfProfile để kiểm tra thông tin cá nhân...");
    const selfRes = await getSelfProfile(session);
    if (!selfRes || !selfRes.user || !selfRes.user.nickname || !selfRes.user.sec_uid) {
      const msg = "Checkpoint 1 thất bại: Phản hồi getSelfProfile thiếu thông tin user (Session expired).";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "auth_expired", message: msg };
    }
    console.log(`[Diagnostic] Checkpoint 1 thành công. Nickname: ${selfRes.user.nickname}`);

    console.log("[Diagnostic] Checkpoint 2: Gọi searchAweme với từ khóa 'girl'...");
    const searchRes = await searchAweme(session, "girl", 0);
    const nilType = searchRes?.search_nil_info?.search_nil_type || searchRes?.search_nil_info?.search_nil_item;
    const resultStatus = searchRes?.result_status;

    if (searchRes?.verify_type || searchRes?.status_code === 2483 || searchRes?.verify_check || nilType === "verify_check" || resultStatus === 5) {
      const msg = `Checkpoint 2 thất bại: Douyin yêu cầu xác minh anti-bot (search_nil_type: "${nilType || "verify_check"}", result_status: ${resultStatus ?? "N/A"}). Cần mở browser non-headless và hoàn thành captcha slider.`;
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "challenge_required", message: msg, details: { nilType, resultStatus } };
    }

    const data = searchRes?.data || searchRes?.aweme_list || [];
    if (data.length === 0) {
      if (nilType) {
        const msg = `Checkpoint 2 thất bại: Douyin trả về search_nil_type: "${nilType}". Cần mở browser non-headless và giải captcha.`;
        console.warn(`[Diagnostic] ${msg}`);
        return { code: "challenge_required", message: msg, details: { nilType } };
      }
      const msg = "Checkpoint 2 thất bại: searchAweme không trả về kết quả nào (data.length === 0).";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "empty_search", message: msg };
    }
    console.log(`[Diagnostic] Checkpoint 2 thành công. Tìm thấy ${data.length} kết quả tìm kiếm.`);

    // Lấy aweme_id đầu tiên để chạy thử Checkpoint 3
    let firstAwemeId = "";
    for (const item of data) {
      const info = item.aweme_info ?? item.aweme_mix_info?.mix_items?.[0];
      if (info?.aweme_id) {
        firstAwemeId = info.aweme_id;
        break;
      }
    }

    if (!firstAwemeId) {
      const msg = "Checkpoint 2 thành công nhưng không tìm thấy aweme_id hợp lệ nào để chạy tiếp Checkpoint 3.";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "empty_search", message: msg };
    }

    console.log(`[Diagnostic] Checkpoint 3: Gọi getAwemeDetail cho video ID: ${firstAwemeId}...`);
    const detailRes = await getAwemeDetail(session, firstAwemeId);
    if (!detailRes || !detailRes.aweme_detail || detailRes.aweme_detail.aweme_id !== firstAwemeId) {
      const msg = "Checkpoint 3 thất bại: Phản hồi getAwemeDetail không hợp lệ hoặc sai ID.";
      console.warn(`[Diagnostic] ${msg}`);
      return { code: "network_error", message: msg };
    }
    console.log("[Diagnostic] Checkpoint 3 thành công.");
    console.log("[Diagnostic] Kết luận: Phiên đăng nhập hoạt động tốt (PASS).");
    return { code: "ok", message: "Session healthy and alive" };
  } catch (err) {
    const msg = `Lỗi trong quá trình chuẩn đoán phiên: ${(err as Error).message}`;
    console.error(`[Diagnostic] ${msg}`);
    return { code: "network_error", message: msg };
  }
}

/**
 * # Chạy kiểm tra chuẩn đoán phiên (trả về boolean tương thích ngược)
 */
export async function runSessionDiagnostic(session: DouyinSession): Promise<boolean> {
  const result = await runSessionDiagnosticDetailed(session);
  return result.code === "ok";
}
