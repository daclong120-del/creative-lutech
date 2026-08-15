import {
  getSelfProfile,
  getAwemeDetail,
  getCreatorProfile,
  getCreatorPosts,
  getComments,
  getReplyComments,
  searchAweme,
} from "./api.js";
import { mapAwemeToPostRow, mapCommentRow } from "./mapper.js";
import {
  checkoutAccount,
  checkinAccount,
  releaseAccount,
  upsertAuthor,
  upsertPost,
  upsertPosts,
  upsertComments,
  getPostUuid,
} from "../../store/index.js";
import {
  resolveShortUrl,
} from "./help.js";
import { DouyinSession, createSessionFromRaw } from "./session.js";
import { runSessionDiagnostic, runSessionDiagnosticDetailed } from "./session_diagnostic.js";
import { sleep, CRAWL_SLEEP_MS } from "./http_client.js";
import { DouyinAweme } from "../../model/douyin.js";
import { CrawledPostRow } from "../../model/storage.js";
import type { ICrawler } from "../../base/base_crawler.js";
import { SessionExpiredError } from "./exception.js";

let currentSession: DouyinSession | null = null;
let currentAccountId: string | null = null;
let currentAccountIsSuspect = false;

/**
 * # Trích xuất aweme_id (ID video) từ URL Douyin bất kỳ
 */
export function extractAwemeId(url: string): string {
  if (/^\d+$/.test(url)) {
    return url;
  }
  const match = url.match(/\/video\/(\d+)/);
  if (match) {
    return match[1];
  }
  const modalMatch = url.match(/[?&]modal_id=(\d+)/);
  if (modalMatch) {
    return modalMatch[1];
  }
  throw new Error("Không thể trích xuất ID video từ URL cung cấp");
}

/**
 * # Trích xuất ID kênh (sec_user_id) từ URL Douyin bất kỳ
 */
export async function extractSecUserId(url: string): Promise<string> {
  if (url.startsWith("MS4wLjABAAAA")) {
    return url;
  }
  const resolvedUrl = await resolveShortUrl(url);
  const match = resolvedUrl.match(/\/user\/([^/?]+)/);
  if (match) {
    return match[1];
  }
  throw new Error("Không thể trích xuất ID kênh (sec_user_id) từ URL cung cấp");
}

/**
 * # Đảm bảo trạng thái đăng nhập Douyin hợp lệ trước khi cào bằng xoay vòng tài khoản và chuẩn đoán phiên
 */
export async function ensureLogin(): Promise<DouyinSession> {
  let attempts = 0;
  const maxAttempts = 5;
  const seenAccountIds = new Set<string>();

  while (attempts < maxAttempts) {
    const account = await checkoutAccount("douyin");
    if (!account) {
      break;
    }

    if (seenAccountIds.has(account.id)) {
      console.log(`Tài khoản ${account.username} (ID: ${account.id}) đã được kiểm tra trong phiên này. Kết thúc tìm kiếm pool.`);
      await releaseAccount(account.id);
      break;
    }
    seenAccountIds.add(account.id);

    console.log(`Đang kiểm tra tài khoản từ pool: ${account.username} (ID: ${account.id})...`);

    let session: DouyinSession;
    try {
      const data = JSON.parse(account.cookie_data);
      session = createSessionFromRaw(data, "pool");
    } catch {
      session = createSessionFromRaw(account.cookie_data, "pool");
    }

    const diagResult = await runSessionDiagnosticDetailed(session);
    if (diagResult.code === "ok") {
      console.log(`Tài khoản ${account.username} hoạt động tốt. Sẵn sàng cào.`);
      currentSession = session;
      currentAccountId = account.id;
      currentAccountIsSuspect = false;
      return currentSession;
    } else if (diagResult.code === "challenge_required") {
      console.warn(`[Douyin Heartbeat] Tài khoản ${account.username} gặp Douyin anti-bot challenge (verify_check). Khởi động Session Recovery...`);
      try {
        const { recoverDouyinSessionDetailed } = await import("./session_recovery.js");
        const recResult = await recoverDouyinSessionDetailed(session, { keyword: "funny", reason: diagResult.code, accountId: account.id });
        if (recResult.success && recResult.session) {
          console.log(`✅ Session Recovery thành công! Tài khoản ${account.username} đã vượt qua challenge.`);
          currentSession = recResult.session;
          currentAccountId = account.id;
          currentAccountIsSuspect = false;
          return currentSession;
        } else {
          console.warn(`[Session Recovery] Recovery thất bại cho tài khoản ${account.username}. Lý do: ${recResult.reason}`);
        }
      } catch (recErr: any) {
        console.error(`[Session Recovery] Phục hồi phiên thất bại: ${recErr.message}`);
      }
      await checkinAccount(account.id, false);
      attempts++;
    } else {
      console.warn(`[Douyin Heartbeat] Tài khoản ${account.username} không pass được heartbeat (Reason: ${diagResult.code}). Đánh dấu lỗi và xoay vòng...`);
      // Đánh dấu tài khoản lỗi (tăng failure_count và tự động ban nếu đạt 3 lần lỗi)
      await checkinAccount(account.id, false);
      attempts++;
    }
  }

  console.log("Không có tài khoản hoạt động nào từ Pool DB. Đang thử bằng cookie cục bộ...");
  const { loadSession, saveSession } = await import("../../sign/session_store.js");
  const localSessionData = await loadSession();
  if (localSessionData) {
    const localSession = createSessionFromRaw(localSessionData, "local");
    const localDiag = await runSessionDiagnosticDetailed(localSession);
    if (localDiag.code === "ok") {
      console.log("Cookie cục bộ hoạt động tốt.");
      currentSession = localSession;
      currentAccountId = null;
      currentAccountIsSuspect = false;
      return currentSession;
    } else if (localDiag.code === "challenge_required" || localDiag.code === "missing_identity") {
      console.warn(`[Douyin Heartbeat] Cookie cục bộ gặp ${localDiag.code}. Khởi động Session Recovery...`);
      try {
        const { recoverDouyinSessionDetailed } = await import("./session_recovery.js");
        const recResult = await recoverDouyinSessionDetailed(localSession, { keyword: "funny", reason: localDiag.code });
        if (recResult.success && recResult.session) {
          console.log("✅ Phục hồi cookie cục bộ thành công! Tiến hành lưu session mới vào local output/session.json...");
          
          // BƯỚC 4: PERSIST LOCAL SESSION CHỈ KHI RECOVERY DIAGNOSTIC PASS "OK"
          await saveSession({
            cookies: recResult.session.cookies,
            msToken: recResult.session.msToken,
            userAgent: recResult.session.userAgent,
            webid: recResult.session.webid,
            verifyFp: recResult.session.verifyFp,
            fp: recResult.session.fp,
            uifid: recResult.session.uifid,
            xmst: recResult.session.xmst,
          });

          currentSession = recResult.session;
          currentAccountId = null;
          currentAccountIsSuspect = false;
          return currentSession;
        } else {
          console.warn(`[Session Recovery] Phục hồi cookie cục bộ thất bại. Lý do: ${recResult.reason}`);
        }
      } catch (recErr: any) {
        console.error(`[Session Recovery] Phục hồi cookie cục bộ thất bại: ${recErr.message}`);
      }
    }
    console.warn(`[Douyin Heartbeat] Cookie cục bộ không pass heartbeat check.`);
  }

  throw new SessionExpiredError("No valid browser-authenticated session available for Douyin crawler. Diagnostic check failed.");
}

/**
 * # Xác thực tính đúng đắn của dữ liệu aweme_detail
 */
function validateAwemeDetail(detail: any): DouyinAweme {
  if (!detail || typeof detail !== "object") {
    throw new Error("Dữ liệu chi tiết video không hợp lệ (không phải object)");
  }
  if (!detail.aweme_id || typeof detail.aweme_id !== "string") {
    throw new Error("Dữ liệu chi tiết video thiếu aweme_id hoặc aweme_id không phải string");
  }
  if (detail.video && typeof detail.video !== "object") {
    throw new Error(`Video ${detail.aweme_id} chứa trường video không hợp lệ`);
  }
  if (detail.statistics && typeof detail.statistics !== "object") {
    throw new Error(`Video ${detail.aweme_id} chứa trường statistics không hợp lệ`);
  }
  return detail as DouyinAweme;
}

/**
 * # Xác thực tính đúng đắn của phản hồi profile creator
 */
function validateUserProfile(res: any): void {
  if (!res || typeof res !== "object") {
    throw new Error("Dữ liệu profile creator không hợp lệ");
  }
  if (!res.user || typeof res.user !== "object") {
    throw new Error("Dữ liệu profile creator thiếu thông tin user");
  }
  if (!res.user.sec_uid || typeof res.user.sec_uid !== "string") {
    throw new Error("Dữ liệu profile creator thiếu sec_uid hợp lệ");
  }
}

/**
 * # Lưu thông tin tác giả và bài đăng chi tiết vào Supabase
 */
export async function persistAweme(
  detail: DouyinAweme,
  options?: { authorUuid?: string; skipDbWrite?: boolean }
): Promise<CrawledPostRow> {
  let authorUuid = options?.authorUuid;
  if (!authorUuid) {
    const authorData = detail.author;
    const rawAvatarUrl = authorData?.avatar_thumb?.url_list?.[0] || authorData?.avatar_larger?.url_list?.[0];
    authorUuid = await upsertAuthor({
      platform: "douyin",
      platform_uid: authorData?.sec_uid || "unknown",
      nickname: authorData?.nickname || "Người dùng Douyin",
      avatar_url: rawAvatarUrl || undefined,
      raw: authorData,
    });
  }

  const postData = mapAwemeToPostRow(detail, authorUuid);

  if (!options?.skipDbWrite) {
    await upsertPost(postData);
  }

  return postData;
}

/**
 * # Cào chi tiết một video từ Douyin và thực hiện lưu DB
 */
export async function crawlVideo(urlOrId: string): Promise<void> {
  const session = currentSession || await ensureLogin();
  const resolvedUrl = await resolveShortUrl(urlOrId);
  const awemeId = extractAwemeId(resolvedUrl || urlOrId);

  const res = await getAwemeDetail(session, awemeId);
  const detail = validateAwemeDetail(res.aweme_detail);

  await persistAweme(detail);
}

/**
 * # Cào toàn bộ video từ một creator và lưu vào DB
 */
export async function crawlCreator(urlOrSecUid: string): Promise<void> {
  const session = currentSession || await ensureLogin();
  const secUserId = await extractSecUserId(urlOrSecUid);

  console.log(`Bắt đầu cào thông tin creator cho sec_user_id: ${secUserId}`);
  const userProfileRes = await getCreatorProfile(session, secUserId);

  validateUserProfile(userProfileRes);
  const user = userProfileRes.user;

  console.log(`Tìm thấy creator: ${user.nickname}`);
  const authorUuid = await upsertAuthor({
    platform: "douyin",
    platform_uid: secUserId,
    nickname: user.nickname || "Người dùng Douyin",
    avatar_url: user.avatar_thumb?.url_list?.[0] || user.avatar_larger?.url_list?.[0] || undefined,
    raw: user,
  });

  const maxPosts = process.env.CREATOR_MAX_POSTS ? parseInt(process.env.CREATOR_MAX_POSTS, 10) : Infinity;
  let maxCursor = "0";
  let hasMore = 1;
  let crawlCount = 0;

  console.log(`Bắt đầu cào danh sách video của creator, giới hạn tối đa: ${maxPosts}`);

  while (hasMore === 1 && crawlCount < maxPosts) {
    const postRes = await getCreatorPosts(session, secUserId, maxCursor);

    hasMore = postRes.has_more ?? 0;
    maxCursor = postRes.max_cursor ? String(postRes.max_cursor) : "0";
    const awemeList = postRes.aweme_list || [];

    console.log(`Lấy được trang video mới với ${awemeList.length} video. maxCursor tiếp theo: ${maxCursor}`);

    if (awemeList.length === 0) {
      break;
    }

    const pagePosts: CrawledPostRow[] = [];
    for (const item of awemeList) {
      if (crawlCount >= maxPosts) {
        break;
      }

      console.log(`Đang xử lý video thứ ${crawlCount + 1}: ${item.aweme_id} - ${item.desc || "Không tiêu đề"}`);

      try {
        let detail = item;
        const needsRefetch = !item.video?.play_addr?.url_list?.[0] && !(item.images && item.images.length > 0);
        if (needsRefetch) {
          console.log(`Video ${item.aweme_id} thiếu link media, tiến hành re-fetch chi tiết...`);
          const detailRes = await getAwemeDetail(session, item.aweme_id);
          detail = validateAwemeDetail(detailRes.aweme_detail);
        } else {
          detail = validateAwemeDetail(item);
        }

        const postRow = await persistAweme(detail, { authorUuid, skipDbWrite: true });
        pagePosts.push(postRow);
        crawlCount++;
      } catch (err) {
        console.log(`Lỗi khi xử lý video ${item.aweme_id}: ${(err as Error).message}`);
      }

      await sleep(CRAWL_SLEEP_MS);
    }

    if (pagePosts.length > 0) {
      await upsertPosts(pagePosts);
    }
  }

  console.log(`Hoàn thành cào creator ${user.nickname}. Tổng số video đã xử lý thành công: ${crawlCount}`);
}

/**
 * # Cào danh sách video từ Douyin theo từ khóa và lưu vào Supabase
 */
export async function crawlSearch(keyword: string, maxCount = 20): Promise<void> {
  const session = currentSession || await ensureLogin();
  let page = 0;
  let searchId = "";
  let collected = 0;
  const limit = 10;

  console.log(`Bắt đầu cào tìm kiếm với từ khóa: "${keyword}", giới hạn tối đa: ${maxCount}`);

  while (collected < maxCount) {
    const offset = page * limit;
    const res = await searchAweme(session, keyword, offset, searchId);

    const data = res.data ?? [];
    console.log(`Lấy được trang kết quả tìm kiếm thứ ${page + 1} với ${data.length} phần tử.`);

    if (data.length === 0) {
      if (!res.data) {
        console.warn(`[Douyin Search Warning] Phản hồi không chứa trường "data". Response dump:`, JSON.stringify(res).substring(0, 400));
      } else {
        console.log(`[Douyin Search] Kết thúc tìm kiếm do hết kết quả (empty thật).`);
      }

      if (page === 0) {
        throw new Error("Douyin Search returned 0 results on page 1 (possible soft block or empty session)");
      }
      break;
    }

    searchId = res.search_id || res.extra?.logid || res.log_pb?.impr_id || searchId;

    const pagePosts: CrawledPostRow[] = [];
    for (const item of data) {
      if (collected >= maxCount) {
        break;
      }

      const info = item.aweme_info ?? item.aweme_mix_info?.mix_items?.[0];
      if (!info?.aweme_id) {
        continue;
      }

      console.log(`Đang xử lý video tìm kiếm thứ ${collected + 1}: ${info.aweme_id} - ${info.desc || "Không tiêu đề"}`);

      try {
        console.log(`Tiến hành tải chi tiết video ${info.aweme_id} từ endpoint detail...`);
        const detailRes = await getAwemeDetail(session, info.aweme_id);
        const detail = validateAwemeDetail(detailRes.aweme_detail);

        const postRow = await persistAweme(detail, { skipDbWrite: true });
        pagePosts.push(postRow);
        collected++;
      } catch (err) {
        console.log(`Lỗi khi xử lý video tìm kiếm ${info.aweme_id}: ${(err as Error).message}`);
      }

      await sleep(CRAWL_SLEEP_MS);
    }

    if (pagePosts.length > 0) {
      await upsertPosts(pagePosts);
    }

    page++;
    await sleep(CRAWL_SLEEP_MS);
  }

  console.log(`Hoàn thành cào tìm kiếm từ khóa "${keyword}". Tổng số video đã xử lý: ${collected}`);
}

/**
 * # Cào bình luận của video từ Douyin và lưu vào Supabase
 */
export async function crawlComments(
  awemeId: string,
  options: { maxCount?: number; withReplies?: boolean } = {}
): Promise<void> {
  const session = currentSession || await ensureLogin();
  const maxCount = options.maxCount ?? 50;
  const withReplies = options.withReplies ?? false;

  console.log(`Bắt đầu cào bình luận cho video: ${awemeId}, giới hạn tối đa: ${maxCount}`);

  const postUuid = await getPostUuid("douyin", awemeId);

  const collected: any[] = [];
  let commentsHasMore = true;
  let commentsCursor = 0;

  while (commentsHasMore && collected.length < maxCount) {
    const commentsRes = await getComments(session, awemeId, commentsCursor);

    commentsHasMore = commentsRes.has_more === 1 || commentsRes.has_more === true;
    commentsCursor = commentsRes.cursor ?? 0;
    const comments = commentsRes.comments ?? [];

    if (comments.length === 0) {
      break;
    }

    const primaryComments = comments.slice(0, maxCount - collected.length);
    const mappedPrimary = primaryComments.map((c: any) => mapCommentRow(c, awemeId, postUuid));
    await upsertComments(mappedPrimary);

    for (const c of primaryComments) {
      collected.push(c);
    }

    if (withReplies) {
      for (const comment of primaryComments) {
        const replyCommentTotal = comment.reply_comment_total ?? 0;
        if (replyCommentTotal > 0) {
          const commentId = comment.cid;
          let subCommentsHasMore = true;
          let subCommentsCursor = 0;
          const subCollected: any[] = [];

          while (subCommentsHasMore) {
            const subCommentsRes = await getReplyComments(session, commentId, awemeId, subCommentsCursor);

            subCommentsHasMore = subCommentsRes.has_more === 1 || subCommentsRes.has_more === true;
            subCommentsCursor = subCommentsRes.cursor ?? 0;
            const subComments = subCommentsRes.comments ?? [];

            if (subComments.length === 0) {
              break;
            }

            const mappedSub = subComments.map((sc: any) => mapCommentRow(sc, awemeId, postUuid, commentId));
            await upsertComments(mappedSub);

            for (const sc of subComments) {
              subCollected.push(sc);
            }

            await sleep(CRAWL_SLEEP_MS);
          }
        }
      }
    }

    await sleep(CRAWL_SLEEP_MS);
  }

  console.log(`Hoàn thành cào bình luận cho video ${awemeId}. Tổng số bình luận cấp 1 đã xử lý: ${collected.length}`);
}

/**
 * # Lớp Crawler dành riêng cho nền tảng Douyin triển khai giao diện ICrawler
 */
export class DouyinCrawler implements ICrawler {
  /**
   * # Thực hiện cào chi tiết video Douyin
   */
  async crawl(target: string): Promise<void> {
    try {
      await ensureLogin();
      await crawlVideo(target);
      if (currentAccountId) {
        if (currentAccountIsSuspect) {
          await releaseAccount(currentAccountId);
        } else {
          await checkinAccount(currentAccountId, true);
        }
      }
    } catch (err) {
      if (currentAccountId) {
        await checkinAccount(currentAccountId, false);
      }
      throw err;
    } finally {
      currentSession = null;
      currentAccountId = null;
    }
  }

  /**
   * # Thực hiện cào profile creator và video của họ trên Douyin
   */
  async creator(target: string): Promise<void> {
    try {
      await ensureLogin();
      await crawlCreator(target);
      if (currentAccountId) {
        if (currentAccountIsSuspect) {
          await releaseAccount(currentAccountId);
        } else {
          await checkinAccount(currentAccountId, true);
        }
      }
    } catch (err) {
      if (currentAccountId) {
        await checkinAccount(currentAccountId, false);
      }
      throw err;
    } finally {
      currentSession = null;
      currentAccountId = null;
    }
  }

  /**
   * # Tìm kiếm video Douyin theo từ khóa
   */
  async search(keyword: string, maxCount?: number): Promise<void> {
    try {
      await ensureLogin();
      await crawlSearch(keyword, maxCount);
      if (currentAccountId) {
        if (currentAccountIsSuspect) {
          await releaseAccount(currentAccountId);
        } else {
          await checkinAccount(currentAccountId, true);
        }
      }
    } catch (err) {
      if (currentAccountId) {
        await checkinAccount(currentAccountId, false);
      }
      throw err;
    } finally {
      currentSession = null;
      currentAccountId = null;
    }
  }

  /**
   * # Cào bình luận của video Douyin
   */
  async comments(target: string, maxCount?: number): Promise<void> {
    try {
      await ensureLogin();
      await crawlComments(target, { maxCount, withReplies: false });
      if (currentAccountId) {
        if (currentAccountIsSuspect) {
          await releaseAccount(currentAccountId);
        } else {
          await checkinAccount(currentAccountId, true);
        }
      }
    } catch (err) {
      if (currentAccountId) {
        await checkinAccount(currentAccountId, false);
      }
      throw err;
    } finally {
      currentSession = null;
      currentAccountId = null;
    }
  }

  async ensureLogin(): Promise<void> {
    await ensureLogin();
  }

  async releaseAccount(isSuccessful: boolean): Promise<void> {
    if (currentAccountId) {
      if (isSuccessful) {
        if (currentAccountIsSuspect) {
          await releaseAccount(currentAccountId);
        } else {
          await checkinAccount(currentAccountId, true);
        }
      } else {
        await checkinAccount(currentAccountId, false);
      }
      currentAccountId = null;
      currentSession = null;
    }
  }
}
