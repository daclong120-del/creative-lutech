/**
 * # Crawler chính cho Bilibili — orchestrator điều phối search, detail, creator
 */

import { bilibiliGet, downloadMedia, pong, setBilibiliCookie } from "./client.js";
import { upsertAuthor, upsertPost, upsertPosts, getPostUuid, upsertComments, checkoutAccount, checkinAccount, releaseAccount, isTaskCancelled, updateTaskProgress, updateTaskPhase, updateTaskCommentProgress } from "../../store/index.js";
import { CrawledPostRow } from "../../model/storage.js";
import type { ICrawler } from "../../base/base_crawler.js";
import { logger } from "../../utils/index.js";

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

type LoginSession = { mode: "account"; accountId: string } | { mode: "guest" };

/**
 * # Đảm bảo trạng thái đăng nhập hợp lệ trước khi cào
 */
async function ensureLogin(): Promise<LoginSession> {
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    const account = await checkoutAccount("bilibili");
    if (!account) {
      break;
    }
    console.log(`Đang kiểm tra tài khoản từ pool: ${account.username} (ID: ${account.id})...`);
    setBilibiliCookie(account.cookie_data);
    const isActive = await pong();
    if (isActive) {
      console.log(`Tài khoản ${account.username} hoạt động tốt. Sẵn sàng cào.`);
      return { mode: "account", accountId: account.id };
    } else {
      console.log(`Tài khoản ${account.username} không hoạt động hoặc bị chặn. Đang đánh dấu lỗi...`);
      await checkinAccount(account.id, false);
      attempts++;
    }
  }
  console.log("Không có tài khoản hoạt động nào từ Pool DB. Đang thử bằng cookie cục bộ/môi trường...");
  setBilibiliCookie("");
  const localIsActive = await pong();
  if (localIsActive) {
    console.log("Cookie cục bộ/môi trường hoạt động tốt.");
    return { mode: "guest" };
  }
  throw new Error("browser mode removed, provide valid cookie/session");
}

/**
 * # Phân tách ID video từ link hoặc mã BV
 */
export function parseVideoInfoFromUrl(url: string): string {
  if (url.startsWith("BV")) {
    return url;
  }
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
  if (match) {
    return match[1];
  }
  throw new Error("Không thể trích xuất mã BV từ link video");
}

/**
 * # Phân tách ID tác giả từ link hoặc mã số UID
 */
export function parseCreatorInfoFromUrl(url: string): string {
  if (/^\d+$/.test(url)) {
    return url;
  }
  const match = url.match(/space\.bilibili\.com\/(\d+)/);
  if (match) {
    return match[1];
  }
  throw new Error("Không thể trích xuất UID từ link kênh");
}

/**
 * # Chuyển đổi dữ liệu bình luận gốc sang cấu trúc database
 */
function mapBilibiliComment(c: any, bvid: string, postUuid?: string, parentCid?: string) {
  return {
    platform: "bilibili",
    platform_cid: String(c.rpid),
    post_id: postUuid,
    platform_post_id: bvid,
    parent_cid: parentCid ? String(parentCid) : undefined,
    author_uid: String(c.member?.mid || c.mid || ""),
    author_nickname: c.member?.uname || "",
    content: c.content?.message || "",
    like_count: c.like || 0,
    raw: c,
    published_at: c.ctime ? new Date(c.ctime * 1000).toISOString() : undefined,
  };
}

/**
 * # Lưu thông tin tác giả và bài đăng chi tiết của Bilibili vào Supabase + upload R2
 */
export async function persistBilibiliVideo(
  detailRes: any,
  options?: { authorUuid?: string; skipDbWrite?: boolean }
): Promise<CrawledPostRow> {
  const view = detailRes.View;
  if (!view) {
    throw new Error("Phản hồi chi tiết video không có trường View");
  }

  const bvid = view.bvid;
  const owner = view.owner || {};

  let authorUuid = options?.authorUuid;
  if (!authorUuid) {
    authorUuid = await upsertAuthor({
      platform: "bilibili",
      platform_uid: String(owner.mid || "unknown"),
      nickname: owner.name || "Người dùng Bilibili",
      avatar_url: owner.face || undefined,
      raw: owner,
    });
  }

  // 1. Xác định media type và URL gốc
  const mediaType = "video";
  const originalCoverUrl = view.pic || "";
  const canonicalUrl = `https://www.bilibili.com/video/${bvid}`;
  const originalMediaUrls = [canonicalUrl];
  
  const mediaUrls = [canonicalUrl];
  const coverUrl = originalCoverUrl;
  const mediaSource = "original";
  const mediaStatus = "original_only";
  const mediaError = null;
  const mediaCachedAt = null;

  const publishedAt = view.pubdate ? new Date(view.pubdate * 1000).toISOString() : new Date().toISOString();
  const stat = view.stat || {};

  const postData: CrawledPostRow = {
    platform: "bilibili",
    platform_id: bvid,
    author_id: authorUuid,
    caption: view.desc || view.title || "",
    media_urls: mediaUrls,
    cover_url: coverUrl || undefined,
    stats: {
      digg_count: stat.like ?? 0,
      comment_count: stat.reply ?? 0,
      share_count: stat.share ?? 0,
      play_count: stat.view ?? 0,
    },
    raw: detailRes,
    published_at: publishedAt,
    media_type: mediaType,
    original_media_urls: originalMediaUrls,
    original_cover_url: originalCoverUrl || undefined,
    media_status: mediaStatus,
    media_source: mediaSource,
    media_error: mediaError,
    media_cached_at: mediaCachedAt || undefined,
  };

  if (!options?.skipDbWrite) {
    await upsertPost(postData);
  }

  return postData;
}

/**
 * # Cào bình luận của video Bilibili và lưu vào Supabase
 */
export async function crawlComments(
  bvidOrAid: string,
  options: { maxCount?: number; withReplies?: boolean } = {}
): Promise<void> {
  const maxCount = options.maxCount ?? 50;
  const withReplies = options.withReplies ?? false;

  let aid = "";
  let bvid = "";
  if (bvidOrAid.startsWith("BV")) {
    bvid = bvidOrAid;
  }
  
  const detailRes = await bilibiliGet("/x/web-interface/view/detail", bvid ? { bvid } : { aid: bvidOrAid }, false);
  const view = detailRes.View;
  if (!view) {
    throw new Error("Không thể lấy thông tin video để cào bình luận");
  }
  aid = String(view.aid);
  bvid = view.bvid;

  const postUuid = await getPostUuid("bilibili", bvid);

  const collected: any[] = [];
  let commentsHasMore = true;
  let nextCursor = 0;

  while (commentsHasMore && collected.length < maxCount) {
    if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
      console.log("Nhiệm vụ đã bị hủy từ giao diện. Dừng cào bình luận.");
      return;
    }

    const commentsRes = await bilibiliGet(
      "/x/v2/reply/wbi/main",
      {
        oid: aid,
        mode: "3",
        type: "1",
        ps: "20",
        next: String(nextCursor),
      },
      true
    );

    const cursor = commentsRes.cursor || {};
    commentsHasMore = cursor.is_end === false;
    nextCursor = cursor.next ?? 0;

    const replies = commentsRes.replies ?? [];
    if (replies.length === 0) {
      break;
    }

    const primaryComments = replies.slice(0, maxCount - collected.length);
    const mappedPrimary = primaryComments.map((c: any) => mapBilibiliComment(c, bvid, postUuid));
    await upsertComments(mappedPrimary);

    for (const c of primaryComments) {
      collected.push(c);
    }

    if (withReplies) {
      for (const comment of primaryComments) {
        const rcount = comment.rcount ?? 0;
        if (rcount > 0) {
          const rootId = comment.rpid;
          let subPn = 1;
          let subHasMore = true;

          // Chỉ cào tối đa 2 trang sub-comments (khoảng 40 sub-replies) để tránh quá tải
          while (subHasMore && subPn <= 2) {
            if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
              console.log("Nhiệm vụ đã bị hủy từ giao diện. Dừng cào bình luận phụ.");
              return;
            }

            const subRes = await bilibiliGet(
              "/x/v2/reply/reply",
              {
                oid: aid,
                type: "1",
                root: String(rootId),
                pn: String(subPn),
                ps: "20",
              },
              false
            );

            const subReplies = subRes.replies ?? [];
            if (subReplies.length === 0) {
              break;
            }

            const mappedSub = subReplies.map((sc: any) => mapBilibiliComment(sc, bvid, postUuid, rootId));
            await upsertComments(mappedSub);

            const count = subRes.page?.count ?? 0;
            subHasMore = count > subPn * 20;
            subPn++;

            await sleep(1000);
          }
        }
      }
    }

    await sleep(1000);
  }
}

/**
 * # Cào toàn bộ video từ một creator và lưu vào DB + R2
 */
export async function crawlCreator(urlOrUid: string, maxCount?: number): Promise<void> {
  const creatorId = parseCreatorInfoFromUrl(urlOrUid);

  logger.info(`Bắt đầu cào thông tin creator cho UID: ${creatorId}`, "Bilibili");
  await updateTaskPhase(process.env.CURRENT_TASK_ID, "collecting_posts");
  const creatorInfoRes = await bilibiliGet("/x/space/wbi/acc/info", { mid: creatorId }, true);

  const nickname = creatorInfoRes.name || "Người dùng Bilibili";
  const faceUrl = creatorInfoRes.face;

  const authorUuid = await upsertAuthor({
    platform: "bilibili",
    platform_uid: creatorId,
    nickname,
    avatar_url: faceUrl || undefined,
    description: creatorInfoRes.sign || undefined,
    raw: creatorInfoRes,
  });

  const maxPosts = maxCount || (process.env.CREATOR_MAX_POSTS ? parseInt(process.env.CREATOR_MAX_POSTS, 10) : Infinity);
  let pn = 1;
  const ps = 30;
  let crawlCount = 0;
  const allCollectedPosts: CrawledPostRow[] = [];

  logger.info(`Bắt đầu cào danh sách video của creator, giới hạn tối đa: ${maxPosts}`, "Bilibili");

  while (crawlCount < maxPosts) {
    if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
      logger.info("Nhiệm vụ đã bị hủy từ giao diện. Dừng cào danh sách video creator space.", "Bilibili");
      return;
    }

    const searchRes = await bilibiliGet("/x/space/wbi/arc/search", {
      mid: creatorId,
      pn: String(pn),
      ps: String(ps),
      order: "pubdate"
    }, true);

    const list = searchRes.list || {};
    const vlist = list.vlist || [];
    if (vlist.length === 0) {
      break;
    }

    const pagePosts: CrawledPostRow[] = [];
    for (const item of vlist) {
      if (crawlCount >= maxPosts) {
        break;
      }
      if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
        logger.info("Nhiệm vụ đã bị hủy từ giao diện. Dừng xử lý video creator.", "Bilibili");
        return;
      }

      logger.info(`Đang xử lý video thứ ${crawlCount + 1}: ${item.bvid} - ${item.title || "Không tiêu đề"}`, "Bilibili");

      try {
        const detailRes = await bilibiliGet("/x/web-interface/view/detail", { bvid: item.bvid }, false);
        const postRow = await persistBilibiliVideo(detailRes, { authorUuid, skipDbWrite: true });
        pagePosts.push(postRow);
        crawlCount++;
        await updateTaskProgress(process.env.CURRENT_TASK_ID, crawlCount, maxPosts === Infinity ? 0 : maxPosts);
      } catch (err) {
        logger.error(`Lỗi khi xử lý video ${item.bvid}: ${(err as Error).message}`, "Bilibili");
      }

      await sleep(1000);
    }

    if (pagePosts.length > 0) {
      await upsertPosts(pagePosts);
      allCollectedPosts.push(...pagePosts);
    }

    const count = searchRes.page?.count ?? 0;
    if (count <= pn * ps) {
      break;
    }
    pn++;
    await sleep(1000);
  }

  logger.info(`Lấy xong video. Bắt đầu cào bình luận cho ${allCollectedPosts.length} video.`, "Bilibili");
  await updateTaskPhase(process.env.CURRENT_TASK_ID, "crawling_comments");

  let postIndex = 0;
  for (const post of allCollectedPosts) {
    postIndex++;
    if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
      logger.info("Nhiệm vụ đã bị hủy từ giao diện. Dừng cào bình luận.", "Bilibili");
      return;
    }
    if (process.env.ENABLE_GET_COMMENTS !== "false") {
      try {
        logger.info(`Đang cào bình luận cho video ${post.platform_id} (${postIndex}/${allCollectedPosts.length})`, "Bilibili");
        await updateTaskCommentProgress(process.env.CURRENT_TASK_ID, postIndex, allCollectedPosts.length);

        const timeoutMs = 60000;
        let timeoutTimer: NodeJS.Timeout;
        const commentTimeoutPromise = new Promise<void>((_, reject) => {
          timeoutTimer = setTimeout(() => reject(new Error(`Timeout cào comment video vượt quá ${timeoutMs / 1000} giây`)), timeoutMs);
        });

        await Promise.race([
          crawlComments(post.platform_id, {
            maxCount: process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10) : 50,
            withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true"
          }),
          commentTimeoutPromise
        ]).finally(() => {
          clearTimeout(timeoutTimer);
        });
      } catch (err) {
        logger.error(`Lỗi khi cào bình luận cho video ${post.platform_id}: ${(err as Error).message}`, "Bilibili");
      }
    }
  }

  logger.info(`Hoàn thành cào creator ${nickname}. Tổng số video đã xử lý: ${crawlCount}`, "Bilibili");
}

/**
 * # Cào danh sách video từ Bilibili theo từ khóa và lưu vào Supabase + R2
 */
export async function crawlSearch(keyword: string, maxCount = 20): Promise<void> {
  let page = 1;
  const limit = 20;
  let collected = 0;
  const allCollectedPosts: CrawledPostRow[] = [];

  logger.info(`Bắt đầu cào tìm kiếm với từ khóa: "${keyword}", giới hạn tối đa: ${maxCount}`, "Bilibili");
  await updateTaskPhase(process.env.CURRENT_TASK_ID, "collecting_posts");

  while (collected < maxCount) {
    if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
      logger.info("Nhiệm vụ đã bị hủy từ giao diện. Dừng cào tìm kiếm.", "Bilibili");
      return;
    }

    const res = await bilibiliGet(
      "/x/web-interface/wbi/search/type",
      {
        search_type: "video",
        keyword: keyword,
        page: String(page),
        page_size: String(limit),
        order: "totalrank",
      },
      true
    );

    const resultList = res.result || [];
    logger.info(`Lấy được trang kết quả tìm kiếm thứ ${page} với ${resultList.length} phần tử.`, "Bilibili");

    if (resultList.length === 0) {
      break;
    }

    const pagePosts: CrawledPostRow[] = [];
    for (const item of resultList) {
      if (collected >= maxCount) {
        break;
      }
      if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
        logger.info("Nhiệm vụ đã bị hủy từ giao diện. Dừng xử lý video tìm kiếm.", "Bilibili");
        return;
      }

      logger.info(`Đang xử lý video tìm kiếm thứ ${collected + 1}: ${item.bvid} - ${item.title || "Không tiêu đề"}`, "Bilibili");

      try {
        const detailRes = await bilibiliGet("/x/web-interface/view/detail", { bvid: item.bvid }, false);
        const postRow = await persistBilibiliVideo(detailRes, { skipDbWrite: true });
        pagePosts.push(postRow);
        collected++;
        await updateTaskProgress(process.env.CURRENT_TASK_ID, collected, maxCount);
      } catch (err) {
        logger.error(`Lỗi khi xử lý video tìm kiếm ${item.bvid}: ${(err as Error).message}`, "Bilibili");
      }

      await sleep(1000);
    }

    if (pagePosts.length > 0) {
      await upsertPosts(pagePosts);
      allCollectedPosts.push(...pagePosts);
    }

    page++;
    await sleep(1000);
  }

  logger.info(`Lấy xong video. Bắt đầu cào bình luận cho ${allCollectedPosts.length} video.`, "Bilibili");
  await updateTaskPhase(process.env.CURRENT_TASK_ID, "crawling_comments");

  let postIndex = 0;
  for (const post of allCollectedPosts) {
    postIndex++;
    if (await isTaskCancelled(process.env.CURRENT_TASK_ID)) {
      logger.info("Nhiệm vụ đã bị hủy từ giao diện. Dừng cào bình luận.", "Bilibili");
      return;
    }
    if (process.env.ENABLE_GET_COMMENTS !== "false") {
      try {
        logger.info(`Đang cào bình luận cho video ${post.platform_id} (${postIndex}/${allCollectedPosts.length})`, "Bilibili");
        await updateTaskCommentProgress(process.env.CURRENT_TASK_ID, postIndex, allCollectedPosts.length);

        const timeoutMs = 60000;
        let timeoutTimer: NodeJS.Timeout;
        const commentTimeoutPromise = new Promise<void>((_, reject) => {
          timeoutTimer = setTimeout(() => reject(new Error(`Timeout cào comment video vượt quá ${timeoutMs / 1000} giây`)), timeoutMs);
        });

        await Promise.race([
          crawlComments(post.platform_id, {
            maxCount: process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10) : 50,
            withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true"
          }),
          commentTimeoutPromise
        ]).finally(() => {
          clearTimeout(timeoutTimer);
        });
      } catch (err) {
        logger.error(`Lỗi khi cào bình luận cho video ${post.platform_id}: ${(err as Error).message}`, "Bilibili");
      }
    }
  }

  logger.info(`Hoàn thành cào tìm kiếm từ khóa "${keyword}". Tổng số video đã xử lý: ${collected}`, "Bilibili");
}

function isInputOrTargetError(err: any): boolean {
  const msg = err?.message || "";
  return (
    msg.includes("Không thể trích xuất UID từ link kênh") ||
    msg.includes("Không thể trích xuất mã BV từ link video") ||
    msg.includes("Không thể lấy thông tin video để cào bình luận")
  );
}

export class BilibiliCrawler implements ICrawler {
  /**
   * # Thực hiện cào chi tiết video/bài đăng Bilibili
   */
  async crawl(target: string): Promise<void> {
    let session: LoginSession = { mode: "guest" };
    try {
      session = await ensureLogin();
      const bvid = parseVideoInfoFromUrl(target);
      const detailRes = await bilibiliGet("/x/web-interface/view/detail", { bvid }, false);
      const post = await persistBilibiliVideo(detailRes);
      if (process.env.ENABLE_GET_COMMENTS !== "false") {
        try {
          await crawlComments(post.platform_id, {
            maxCount: process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10) : 50,
            withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true"
          });
        } catch (err) {
          console.log(`Lỗi khi cào bình luận cho video ${post.platform_id}: ${(err as Error).message}`);
        }
      }
      if (session.mode === "account") {
        await checkinAccount(session.accountId, true);
      }
    } catch (err) {
      if (session.mode === "account") {
        if (isInputOrTargetError(err)) {
          await releaseAccount(session.accountId);
        } else {
          await checkinAccount(session.accountId, false);
        }
      }
      throw err;
    }
  }

  /**
   * # Thực hiện cào profile creator và video của họ trên Bilibili
   */
  async creator(target: string, maxCount?: number): Promise<void> {
    let session: LoginSession = { mode: "guest" };
    try {
      session = await ensureLogin();
      await crawlCreator(target, maxCount);
      if (session.mode === "account") {
        await checkinAccount(session.accountId, true);
      }
    } catch (err) {
      if (session.mode === "account") {
        if (isInputOrTargetError(err)) {
          await releaseAccount(session.accountId);
        } else {
          await checkinAccount(session.accountId, false);
        }
      }
      throw err;
    }
  }

  /**
   * # Tìm kiếm video Bilibili theo từ khóa
   */
  async search(keyword: string, maxCount?: number): Promise<void> {
    let session: LoginSession = { mode: "guest" };
    try {
      session = await ensureLogin();
      await crawlSearch(keyword, maxCount);
      if (session.mode === "account") {
        await checkinAccount(session.accountId, true);
      }
    } catch (err) {
      if (session.mode === "account") {
        if (isInputOrTargetError(err)) {
          await releaseAccount(session.accountId);
        } else {
          await checkinAccount(session.accountId, false);
        }
      }
      throw err;
    }
  }

  /**
   * # Cào bình luận của video Bilibili
   */
  async comments(target: string, maxCount?: number): Promise<void> {
    let session: LoginSession = { mode: "guest" };
    try {
      session = await ensureLogin();
      await crawlComments(target, { maxCount, withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true" });
      if (session.mode === "account") {
        await checkinAccount(session.accountId, true);
      }
    } catch (err) {
      if (session.mode === "account") {
        if (isInputOrTargetError(err)) {
          await releaseAccount(session.accountId);
        } else {
          await checkinAccount(session.accountId, false);
        }
      }
      throw err;
    }
  }

  async ensureLogin(): Promise<void> {
    await ensureLogin();
  }

  async releaseAccount(isSuccessful: boolean): Promise<void> {
    // Handled internally in methods or no-op
  }
}
