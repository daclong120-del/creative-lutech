/**
 * # Crawler chính cho Zhihu (知乎) — điều phối search, detail, creator, comments
 */

import { ZhihuClient, downloadMedia, getRelativeUri } from "./client.js";
import {
  upsertAuthor,
  upsertPost,
  upsertPosts,
  getPostUuid,
  upsertComments,
  checkoutAccount,
  checkinAccount,
  updateTaskProgress,
} from "../../store/index.js";
import { CrawledPostRow } from "../../model/storage.js";
import type { ICrawler } from "../../base/base_crawler.js";
import { stripHtml, parseCookieString } from "../../utils/crawler.js";
import { logger } from "../../utils/index.js";
import { CONFIG } from "../../config.js";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const ANSWERS_INCLUDE = "data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,attachment,voteup_count,reshipment_settings,comment_permission,created_time,updated_time,review_info,excerpt,paid_info,reaction_instruction,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp;data[*].vessay_info;data[*].author.badge[?(type=best_answerer)].topics;data[*].author.vip_info;data[*].question.has_publishing_draft,relationship";
const ARTICLES_INCLUDE = "data[*].comment_count,suggest_edit,is_normal,thumbnail_extra_info,thumbnail,can_comment,comment_permission,admin_closed_comment,content,voteup_count,created,updated,upvoted_followees,voting,review_info,reaction_instruction,is_labeled,label_info;data[*].vessay_info;data[*].author.badge[?(type=best_answerer)].topics;data[*].author.vip_info;";
const VIDEOS_INCLUDE = "similar_zvideo,creation_relationship,reaction_instruction";

/**
 * # Dừng luồng thực thi trong khoảng thời gian chỉ định
 */
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * # Phân tích và trích xuất loại thực thể từ URL Zhihu
 */
export function parseZhihuUrl(url: string): { type: "answer" | "article" | "zvideo" | "people" | ""; id: string; questionId?: string } {
  if (url.includes("/answer/")) {
    const match = url.match(/\/question\/(\d+)\/answer\/(\d+)/);
    if (match) {
      return { type: "answer", id: match[2], questionId: match[1] };
    }
  } else if (url.includes("/p/")) {
    const match = url.match(/\/p\/(\d+)/);
    if (match) {
      return { type: "article", id: match[1] };
    }
  } else if (url.includes("/zvideo/")) {
    const match = url.match(/\/zvideo\/([a-zA-Z0-9_]+)/);
    if (match) {
      return { type: "zvideo", id: match[1] };
    }
  } else if (url.includes("/people/")) {
    const match = url.match(/\/people\/([^/?#]+)/);
    if (match) {
      return { type: "people", id: match[1] };
    }
  }
  return { type: "", id: "" };
}

/**
 * # Ánh xạ dữ liệu bình luận gốc của Zhihu sang cấu trúc database
 */
function mapZhihuComment(c: any, platformPostId: string, postUuid?: string, parentCid?: string) {
  let ipLocation = "";
  const commentTags = c.comment_tag || [];
  for (const tag of commentTags) {
    if (tag.type === "ip_info") {
      ipLocation = tag.text || "";
      break;
    }
  }

  const author = c.author || {};
  const authorMember = author.member || author;

  return {
    platform: "zhihu",
    platform_cid: String(c.id),
    post_id: postUuid,
    platform_post_id: platformPostId,
    parent_cid: parentCid ? String(parentCid) : (c.reply_comment_id ? String(c.reply_comment_id) : undefined),
    author_uid: String(authorMember.url_token || authorMember.id || ""),
    author_nickname: authorMember.name || "",
    content: stripHtml(c.content || ""),
    like_count: c.like_count || 0,
    raw: c,
    published_at: c.created_time ? new Date(c.created_time * 1000).toISOString() : undefined,
  };
}

/**
 * # Cào chi tiết bài đăng/câu trả lời/zvideo của Zhihu từ trang HTML chi tiết
 */
export async function crawlDetail(
  url: string,
  options?: { authorUuid?: string; skipDbWrite?: boolean }
): Promise<CrawledPostRow | null> {
  const { type, id } = parseZhihuUrl(url);
  if (!type || !id) {
    throw new Error(`URL không hợp lệ: ${url}`);
  }

  const zhihuClient = new ZhihuClient();
  const html = await zhihuClient.request("GET", url, { sign: false, headers: { "Accept": "text/html" } });

  const match = html.match(/<script id="js-initialData"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`Không tìm thấy js-initialData trong HTML trang chi tiết`);
  }

  const jsonData = JSON.parse(match[1]);
  const entities = jsonData.initialState?.entities || {};
  let contentObj: any = null;

  if (type === "answer") {
    contentObj = entities.answers?.[id];
  } else if (type === "article") {
    contentObj = entities.articles?.[id];
  } else if (type === "zvideo") {
    contentObj = entities.zvideos?.[id];
  }

  if (!contentObj) {
    throw new Error(`Không tìm thấy thông tin thực thể ${type} với ID ${id} trong js-initialData`);
  }

  let author = contentObj.author || {};
  if (typeof author === "string") {
    author = entities.users?.[author] || {};
  }
  const authorMember = author.member || author;

  const platformUid = String(authorMember.urlToken || authorMember.url_token || authorMember.id || "unknown");
  const nickname = authorMember.name || "Người dùng Zhihu";

  let authorUuid = options?.authorUuid;
  if (!authorUuid) {
    authorUuid = await upsertAuthor({
      platform: "zhihu",
      platform_uid: platformUid,
      nickname,
      avatar_url: authorMember.avatarUrl || authorMember.avatar_url || undefined,
      gender: authorMember.gender === 1 ? "Male" : (authorMember.gender === 0 ? "Female" : "Unknown"),
      description: authorMember.headline || authorMember.description || undefined,
      raw: authorMember,
    });
  }

  // 1. Xác định title, content_type, source_url và media type
  let title = "";
  if (type === "answer") {
    title = contentObj.question?.title || "";
  } else {
    title = contentObj.title || "";
  }

  let sourceUrl = "";
  if (type === "answer") {
    sourceUrl = `https://www.zhihu.com/question/${contentObj.question?.id || id}/answer/${id}`;
  } else if (type === "article") {
    sourceUrl = `https://zhuanlan.zhihu.com/p/${id}`;
  } else if (type === "zvideo") {
    sourceUrl = `https://www.zhihu.com/zvideo/${id}`;
  }

  const originalCoverUrl = contentObj.thumbnail || contentObj.imageUrl || contentObj.image_url || "";
  const originalMediaUrls: string[] = [];

  let mediaType = "image";
  let mediaStatus = "original_only";
  let mediaSource = "original";

  if (type === "zvideo") {
    mediaType = "video";
    const hasVideo = contentObj.playlist || contentObj.video?.playlist || (contentObj.video && Object.keys(contentObj.video).length > 0);
    if (!hasVideo && !originalCoverUrl) {
      mediaStatus = "unavailable";
      mediaSource = "none";
    }
  } else if (originalCoverUrl) {
    mediaType = "image";
  } else {
    mediaType = "text";
    mediaStatus = "not_applicable";
    mediaSource = "none";
  }

  let coverUrl = originalCoverUrl;
  const mediaUrls: string[] = [...originalMediaUrls];
  let mediaError: string | null = null;
  let mediaCachedAt: string | null = null;

  const publishedAt = contentObj.createdTime || contentObj.created || Math.floor(Date.now() / 1000);
  const caption = stripHtml(contentObj.content || contentObj.excerpt || contentObj.title || "");

  const postData: CrawledPostRow = {
    platform: "zhihu",
    platform_id: id,
    author_id: authorUuid,
    title: title || undefined,
    caption,
    media_urls: mediaUrls,
    cover_url: coverUrl || undefined,
    stats: {
      digg_count: contentObj.voteupCount || contentObj.voteup_count || 0,
      comment_count: contentObj.commentCount || contentObj.comment_count || 0,
      share_count: contentObj.shareCount || 0,
      play_count: contentObj.playCount || 0,
    },
    raw: contentObj,
    published_at: new Date(publishedAt * 1000).toISOString(),
    media_type: mediaType,
    content_type: type,
    source_url: sourceUrl || undefined,
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
 * # Cào bình luận của bài đăng Zhihu và lưu vào database
 */
export async function crawlComments(
  contentId: string,
  contentType: string,
  options: { maxCount?: number; withReplies?: boolean } = {}
): Promise<void> {
  const maxCount = options.maxCount ?? 50;
  const withReplies = options.withReplies ?? false;

  const postUuid = await getPostUuid("zhihu", contentId);
  const zhihuClient = new ZhihuClient();

  const collected: any[] = [];
  let commentsHasMore = true;
  let nextOffset = "";

  while (commentsHasMore && collected.length < maxCount) {
    const commentsRes = await zhihuClient.request(
      "GET",
      `/api/v4/comment_v5/${contentType}s/${contentId}/root_comment?limit=10&offset=${nextOffset}&order=score`
    );

    const paging = commentsRes.paging || {};
    commentsHasMore = paging.is_end === false;

    const nextUrl = paging.next || "";
    if (nextUrl) {
      try {
        const parsedUrl = new URL(nextUrl);
        nextOffset = parsedUrl.searchParams.get("offset") || "";
      } catch {
        nextOffset = "";
      }
    } else {
      nextOffset = "";
    }

    const data = commentsRes.data || [];
    if (data.length === 0) {
      break;
    }

    const primaryComments = data.slice(0, maxCount - collected.length);
    const mappedPrimary = primaryComments.map((c: any) => mapZhihuComment(c, contentId, postUuid));
    await upsertComments(mappedPrimary);

    for (const c of primaryComments) {
      collected.push(c);
    }

    if (withReplies) {
      for (const comment of primaryComments) {
        const childCommentCount = comment.child_comment_count ?? 0;
        if (childCommentCount > 0) {
          const rootId = comment.id;
          let subHasMore = true;
          let subOffset = "";

          while (subHasMore) {
            const subRes = await zhihuClient.request(
              "GET",
              `/api/v4/comment_v5/comment/${rootId}/child_comment?limit=10&offset=${subOffset}&order=sort`
            );

            const subPaging = subRes.paging || {};
            subHasMore = subPaging.is_end === false;

            const subNextUrl = subPaging.next || "";
            if (subNextUrl) {
              try {
                const parsedUrl = new URL(subNextUrl);
                subOffset = parsedUrl.searchParams.get("offset") || "";
              } catch {
                subOffset = "";
              }
            } else {
              subOffset = "";
            }

            const subReplies = subRes.data || [];
            if (subReplies.length === 0) {
              break;
            }

            const mappedSub = subReplies.map((sc: any) => mapZhihuComment(sc, contentId, postUuid, rootId));
            await upsertComments(mappedSub);

            await sleep(1000 + Math.random() * 1000);
          }
        }
      }
    }

    await sleep(1000 + Math.random() * 1000);
  }
}

/**
 * # Cào thông tin creator và toàn bộ bài đăng của creator trên Zhihu
 */
export async function crawlCreator(urlOrToken: string): Promise<void> {
  let urlToken = urlOrToken;
  if (urlOrToken.includes("/people/")) {
    const parsed = parseZhihuUrl(urlOrToken);
    urlToken = parsed.id;
  }

  console.log(`Bắt đầu cào thông tin creator cho token: ${urlToken}`);
  const zhihuClient = new ZhihuClient();
  const profileUrl = `https://www.zhihu.com/people/${urlToken}`;
  const html = await zhihuClient.request("GET", profileUrl, { sign: false, headers: { "Accept": "text/html" } });

  const match = html.match(/<script id="js-initialData"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`Không tìm thấy js-initialData trong HTML trang cá nhân`);
  }

  const jsonData = JSON.parse(match[1]);
  const entities = jsonData.initialState?.entities || {};
  const creatorInfo = entities.users?.[urlToken];
  if (!creatorInfo) {
    throw new Error(`Không tìm thấy thông tin creator ${urlToken} trong js-initialData`);
  }

  const authorUuid = await upsertAuthor({
    platform: "zhihu",
    platform_uid: urlToken,
    nickname: creatorInfo.name || "Người dùng Zhihu",
    avatar_url: creatorInfo.avatarUrl || creatorInfo.avatar_url || undefined,
    gender: creatorInfo.gender === 1 ? "Male" : (creatorInfo.gender === 0 ? "Female" : "Unknown"),
    description: creatorInfo.headline || creatorInfo.description || undefined,
    follows_count: creatorInfo.followingCount || 0,
    fans_count: creatorInfo.followerCount || 0,
    interaction_count: creatorInfo.voteupCount || 0,
    videos_count: creatorInfo.zvideoCount || 0,
    ip_location: creatorInfo.ipInfo || undefined,
    raw: creatorInfo,
  });

  const maxPosts = process.env.CREATOR_MAX_POSTS ? parseInt(process.env.CREATOR_MAX_POSTS, 10) : 20;
  let crawlCount = 0;
  
  const sources = [
    { type: "answer", endpoint: "answers", include: ANSWERS_INCLUDE },
    { type: "article", endpoint: "articles", include: ARTICLES_INCLUDE },
    { type: "zvideo", endpoint: "zvideos", include: VIDEOS_INCLUDE }
  ];

  const pagePosts: CrawledPostRow[] = [];

  for (const source of sources) {
    if (crawlCount >= maxPosts) {
      break;
    }

    let offset = 0;
    const limit = 20;
    let sourceEnd = false;

    console.log(`Bắt đầu cào danh mục ${source.type} của creator`);

    while (crawlCount < maxPosts && !sourceEnd) {
      const url = `/api/v4/members/${urlToken}/${source.endpoint}?include=${encodeURIComponent(source.include)}&offset=${offset}&limit=${limit}&order_by=created`;
      const res = await zhihuClient.request("GET", url);
      const data = res.data || [];
      if (data.length === 0) {
        break;
      }
      
      const paging = res.paging || {};
      sourceEnd = paging.is_end === true;

      for (const item of data) {
        if (crawlCount >= maxPosts) {
          break;
        }

        console.log(`Đang xử lý mục thứ ${crawlCount + 1}: ${item.id}`);

        try {
          let detailUrl = "";
          if (source.type === "answer") {
            detailUrl = `https://www.zhihu.com/question/${item.question?.id}/answer/${item.id}`;
          } else if (source.type === "article") {
            detailUrl = `https://zhuanlan.zhihu.com/p/${item.id}`;
          } else if (source.type === "zvideo") {
            detailUrl = `https://www.zhihu.com/zvideo/${item.id}`;
          }

          if (detailUrl) {
            const postRow = await crawlDetail(detailUrl, { authorUuid, skipDbWrite: true });
            if (postRow) {
              pagePosts.push(postRow);
              crawlCount++;
            }
          }
        } catch (err) {
          console.log(`Lỗi xử lý creator item ${item.id}: ${(err as Error).message}`);
        }

        await sleep(1000 + Math.random() * 1000);
      }

      offset += limit;
      await sleep(1000 + Math.random() * 1000);
    }
  }

    if (pagePosts.length > 0) {
      await upsertPosts(pagePosts);
      for (const post of pagePosts) {
        if (process.env.ENABLE_GET_COMMENTS !== "false") {
          try {
            await crawlComments(post.platform_id, (post.raw as any)?.type || "answer", {
              maxCount: process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10) : 50,
              withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true"
            });
          } catch (err) {
            console.log(`Lỗi khi cào bình luận cho bài đăng ${post.platform_id}: ${(err as Error).message}`);
          }
        }
      }
    }

  console.log(`Hoàn thành cào creator ${creatorInfo.name}. Tổng số bài đăng đã xử lý: ${crawlCount}`);
}

export async function crawlSearch(keyword: string, maxCount = 20, client?: ZhihuClient): Promise<{
  current: number;
  target: number;
  stopReason: "target_reached" | "source_exhausted" | "no_valid_items" | "api_empty" | "api_error";
  resultState: "full" | "partial" | "empty";
}> {
  const limit = 20;
  let collected = 0;
  let page = 1;
  let emptyPageCount = 0;
  let stopReason: "target_reached" | "source_exhausted" | "no_valid_items" | "api_empty" | "api_error" = "source_exhausted";
  const zhihuClient = client || new ZhihuClient();

  logger.info(`Bắt đầu cào tìm kiếm Zhihu với từ khóa: "${keyword}", giới hạn: ${maxCount}`, "Zhihu");

  // URL khởi điểm chuẩn theo trình duyệt thực tế
  let nextUrl = `/api/v4/search_v3?gk_version=gz-gaokao&t=general&q=${encodeURIComponent(keyword)}&correction=1&offset=0&limit=${limit}&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal&zhida_source=ai_search_general`;
  const referer = `https://www.zhihu.com/search?q=${encodeURIComponent(keyword)}&type=content`;

  while (collected < maxCount && nextUrl) {
    const parsedUrl = new URL(nextUrl, "https://www.zhihu.com");
    const offset = parsedUrl.searchParams.get("offset") || "0";
    const lcIdx = parsedUrl.searchParams.get("lc_idx") || "0";
    const searchHashId = parsedUrl.searchParams.get("search_hash_id");
    const verticalInfo = parsedUrl.searchParams.get("vertical_info");
    const hasSearchHashId = searchHashId ? "true" : "false";
    const hasVerticalInfo = verticalInfo ? "true" : "false";

    let searchRes: any;
    try {
      searchRes = await zhihuClient.request("GET", nextUrl, { referer });
    } catch (err: any) {
      logger.error(`Lỗi request API trang tìm kiếm thứ ${page}: ${err.message}`, "Zhihu");
      stopReason = "api_error";
      break;
    }

    const data = searchRes.data || [];
    const searchResults = data.filter((item: any) => item.type === "search_result" || item.type === "zvideo");
    logger.info(`page=${page} offset=${offset} lc_idx=${lcIdx} has_search_hash_id=${hasSearchHashId} has_vertical_info=${hasVerticalInfo} raw_items=${data.length} valid_items=${searchResults.length}`, "Zhihu");

    if (data.length === 0) {
      emptyPageCount++;
      logger.warn(`Trang tìm kiếm thứ ${page} trả về danh sách rỗng (lần ${emptyPageCount}).`, "Zhihu");
      if (emptyPageCount >= 3) {
        stopReason = "api_empty";
        break;
      }
      
      const paging = searchRes.paging || {};
      if (paging.is_end || !paging.next) {
        stopReason = "source_exhausted";
        break;
      }
      nextUrl = getRelativeUri(paging.next);
      page++;
      // Vẫn ghi nhận progress/offset
      if (process.env.CURRENT_TASK_ID) {
        await updateTaskProgress(process.env.CURRENT_TASK_ID, collected, maxCount);
      }
      await sleep(1000 + Math.random() * 1000);
      continue;
    }

    // Reset bộ đếm empty page nếu lấy được data
    emptyPageCount = 0;

    if (searchResults.length === 0) {
      logger.warn(`Trang tìm kiếm thứ ${page} không chứa kết quả hợp lệ (search_result hoặc zvideo). Thử trang tiếp theo...`, "Zhihu");
      
      const paging = searchRes.paging || {};
      if (paging.is_end || !paging.next) {
        stopReason = "no_valid_items";
        break;
      }
      nextUrl = getRelativeUri(paging.next);
      page++;
      if (process.env.CURRENT_TASK_ID) {
        await updateTaskProgress(process.env.CURRENT_TASK_ID, collected, maxCount);
      }
      await sleep(1000 + Math.random() * 1000);
      continue;
    }

    const pagePosts: CrawledPostRow[] = [];
    for (const item of searchResults) {
      if (collected >= maxCount) {
        break;
      }

      const obj = item.object;
      if (!obj) {
        continue;
      }

      logger.info(`Đang xử lý bài đăng tìm kiếm thứ ${collected + 1}: ${obj.id} - ${obj.title || "Không tiêu đề"}`, "Zhihu");

      try {
        // Trích xuất thông tin tác giả trực tiếp từ kết quả tìm kiếm
        let author = obj.author || {};
        const platformUid = String(author.urlToken || author.url_token || author.id || "unknown");
        const nickname = author.name || "Người dùng Zhihu";
        
        const authorUuid = await upsertAuthor({
          platform: "zhihu",
          platform_uid: platformUid,
          nickname,
          avatar_url: author.avatarUrl || author.avatar_url || undefined,
          gender: author.gender === 1 ? "Male" : (author.gender === 0 ? "Female" : "Unknown"),
          description: author.headline || author.description || undefined,
          raw: author,
        });

        const caption = stripHtml(obj.content || obj.excerpt || obj.title || "");
        const originalCoverUrl = obj.thumbnail || obj.imageUrl || obj.image_url || "";
        const publishedAt = obj.createdTime || obj.created || Math.floor(Date.now() / 1000);

        // Xác định metadata content-aware
        const contentType = obj.type || "unknown";
        let title = obj.question?.title || obj.title || "";
        let sourceUrl = "";

        if (contentType === "answer") {
          sourceUrl = `https://www.zhihu.com/question/${obj.question?.id || ""}/answer/${obj.id}`;
        } else if (contentType === "article") {
          sourceUrl = `https://zhuanlan.zhihu.com/p/${obj.id}`;
        } else if (contentType === "zvideo") {
          sourceUrl = `https://www.zhihu.com/zvideo/${obj.id}`;
        }

        let mediaType = "image";
        let mediaStatus = "original_only";
        let mediaSource = "original";

        if (contentType === "zvideo") {
          mediaType = "video";
          const hasVideo = obj.video?.playlist && Object.keys(obj.video.playlist).length > 0;
          if (!hasVideo && !originalCoverUrl) {
            mediaStatus = "unavailable";
            mediaSource = "none";
          }
        } else if (originalCoverUrl) {
          mediaType = "image";
        } else {
          mediaType = "text";
          mediaStatus = "not_applicable";
          mediaSource = "none";
        }

        const postData: CrawledPostRow = {
          platform: "zhihu",
          platform_id: String(obj.id),
          author_id: authorUuid,
          title: title || undefined,
          caption,
          media_urls: [],
          cover_url: originalCoverUrl || undefined,
          stats: {
            digg_count: obj.voteupCount || obj.voteup_count || 0,
            comment_count: obj.commentCount || obj.comment_count || 0,
            share_count: obj.shareCount || 0,
            play_count: obj.playCount || 0,
          },
          raw: obj,
          published_at: new Date(publishedAt * 1000).toISOString(),
          media_type: mediaType,
          content_type: contentType,
          source_url: sourceUrl || undefined,
          original_media_urls: [],
          original_cover_url: originalCoverUrl || undefined,
          media_status: mediaStatus,
          media_source: mediaSource,
        };

        pagePosts.push(postData);
        collected++;
      } catch (err) {
        logger.error(`Lỗi khi trích xuất bài đăng tìm kiếm ${obj.id}: ${(err as Error).message}`, "Zhihu");
      }

      await sleep(100 + Math.random() * 100);
    }

    if (pagePosts.length > 0) {
      await upsertPosts(pagePosts);
      // Cập nhật tiến độ task lên Supabase
      if (process.env.CURRENT_TASK_ID) {
        await updateTaskProgress(process.env.CURRENT_TASK_ID, collected, maxCount);
      }
      
      for (const post of pagePosts) {
        if (process.env.ENABLE_GET_COMMENTS !== "false") {
          try {
            await crawlComments(post.platform_id, (post.raw as any)?.type || "answer", {
              maxCount: process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10) : 50,
              withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true"
            });
          } catch (err) {
            logger.error(`Lỗi khi cào bình luận cho bài đăng ${post.platform_id}: ${(err as Error).message}`, "Zhihu");
          }
        }
      }
    }

    if (collected >= maxCount) {
      stopReason = "target_reached";
      break;
    }

    const paging = searchRes.paging || {};
    if (paging.is_end || !paging.next) {
      stopReason = "source_exhausted";
      break;
    }
    
    // Gán relative path cho trang tiếp theo
    nextUrl = getRelativeUri(paging.next);
    page++;
    await sleep(1000 + Math.random() * 1000);
  }

  let resultState: "full" | "partial" | "empty" = "empty";
  if (collected === 0) {
    resultState = "empty";
  } else if (collected >= maxCount) {
    resultState = "full";
  } else {
    resultState = "partial";
  }

  return {
    current: collected,
    target: maxCount,
    stopReason,
    resultState,
  };
}

export class ZhihuCrawler implements ICrawler {
  private client: ZhihuClient;
  private currentAccountId: string | null = null;

  constructor() {
    this.client = new ZhihuClient();
  }



  async ensureLogin(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 5;

    // 1. Thử lấy tài khoản từ Account Pool trong Database và validate bằng HTTP thô trước
    while (attempts < maxAttempts) {
      const account = await checkoutAccount("zhihu");
      if (!account) {
        break;
      }
      console.log(`Đang kiểm tra tài khoản Zhihu từ pool: ${account.username} (ID: ${account.id})...`);

      const cookieDict = parseCookieString(account.cookie_data);
      // Nạp cookie của account vào client
      await this.client.updateCookies(Object.entries(cookieDict).map(([name, value]) => ({
        name,
        value,
        domain: ".zhihu.com"
      })));

      // Validate bằng HTTP thô không mở browser
      const isActive = await this.client.validateSession();
      if (isActive) {
        console.log(`[Zhihu] Session valid by HTTP for account: ${account.username}`);
        this.currentAccountId = account.id;
        return;
      } else {
        console.log(`[Zhihu] Tài khoản ${account.username} hoàn toàn không hoạt động. Trả lại pool...`);
        await checkinAccount(account.id, false);
        this.currentAccountId = null;
        attempts++;
      }
    }

    // 2. Dự phòng: Sử dụng cookie cục bộ
    console.log("Không có tài khoản hoạt động nào từ Pool DB. Đang thử bằng cookie cục bộ...");
    let localCookie = process.env.ZHIHU_COOKIE || "";
    if (!localCookie) {
      try {
        const sessionPath = join(process.cwd(), "output", "zhihu_session.json");
        const content = await readFile(sessionPath, "utf8");
        localCookie = JSON.parse(content).cookie || "";
      } catch {}
    }

    if (localCookie) {
      const cookieDict = parseCookieString(localCookie);
      await this.client.updateCookies(Object.entries(cookieDict).map(([name, value]) => ({
        name,
        value,
        domain: ".zhihu.com"
      })));

      const localIsActive = await this.client.validateSession();
      if (localIsActive) {
        console.log("[Zhihu] Cookie cục bộ hoạt động tốt bằng HTTP check.");
        this.currentAccountId = null;
        return;
      }
    }

    throw new Error("browser mode removed, provide valid cookie/session");
  }

  async releaseAccount(isSuccessful: boolean): Promise<void> {
    if (this.currentAccountId) {
      await checkinAccount(this.currentAccountId, isSuccessful);
      this.currentAccountId = null;
    }
  }

  /**
   * # Thực hiện cào chi tiết bài đăng Zhihu
   */
  async crawl(target: string): Promise<void> {
    let success = false;
    try {
      await this.ensureLogin();
      const post = await crawlDetail(target);
      if (post && process.env.ENABLE_GET_COMMENTS !== "false") {
        try {
          await crawlComments(post.platform_id, (post.raw as any)?.type || "answer", {
            maxCount: process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10) : 50,
            withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true"
          });
        } catch (err) {
          console.log(`Lỗi khi cào bình luận cho bài đăng ${post.platform_id}: ${(err as Error).message}`);
        }
      }
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Thực hiện cào profile creator và bài đăng của họ trên Zhihu
   */
  async creator(target: string): Promise<void> {
    let success = false;
    try {
      await this.ensureLogin();
      await crawlCreator(target);
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Tìm kiếm bài đăng Zhihu theo từ khóa
   */
  async search(keyword: string, maxCount?: number): Promise<any> {
    let success = false;
    try {
      await this.ensureLogin();
      const res = await crawlSearch(keyword, maxCount, this.client);
      success = true;
      return res;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Cào bình luận của bài đăng Zhihu
   */
  async comments(target: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      await this.ensureLogin();
      const { type, id } = parseZhihuUrl(target);
      if (!type || !id) {
        throw new Error(`URL không hợp lệ: ${target}`);
      }
      await crawlComments(id, type, { maxCount, withReplies: process.env.ENABLE_GET_SUB_COMMENTS === "true" });
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }
}
