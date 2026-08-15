/**
 * # Crawler chính cho Weibo (微博) — điều phối search, detail, creator, comments
 */

import { WeiboClient } from "./client.js";
import { WeiboExtractor } from "./extractor.js";
import {
  upsertAuthor,
  upsertPost,
  upsertPosts,
  upsertComments,
  getPostUuid,
  checkoutAccount,
  checkinAccount,
} from "../../store/index.js";
import { CrawledPostRow } from "../../model/storage.js";
import type { ICrawler } from "../../base/base_crawler.js";
import { CONFIG } from "../../config.js";
import { parseCookieString } from "../../utils/crawler.js";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { WeiboSearchType } from "./field.js";

async function downloadWeiboImage(url: string): Promise<Buffer> {
  let targetUrl = url;
  if (url.startsWith("https://") || url.startsWith("http://")) {
    const cleanUrl = url.replace(/^https?:\/\//, "");
    const parts = cleanUrl.split("/");
    let formatted = "";
    for (let i = 0; i < parts.length; i++) {
      if (i === 1) {
        formatted += "large/";
      } else if (i === parts.length - 1) {
        formatted += parts[i];
      } else {
        formatted += parts[i] + "/";
      }
    }
    targetUrl = `https://i1.wp.com/${formatted}`;
  }

  try {
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!resp.ok) {
      throw new Error(`Hãng ảnh proxy lỗi: status ${resp.status}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  } catch (err) {
    // Trực tiếp tải từ url gốc nếu proxy thất bại
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!resp.ok) {
      throw new Error(`Tải trực tiếp ảnh gốc lỗi: status ${resp.status}`);
    }
    return Buffer.from(await resp.arrayBuffer());
  }
}

async function persistAuthor(rawUser: any): Promise<string> {
  const authorRow = WeiboExtractor.extractAuthor(rawUser);
  return await upsertAuthor(authorRow);
}

async function persistPost(noteItem: any, authorUuid?: string): Promise<string> {
  const postRow = WeiboExtractor.extractPost(noteItem, authorUuid);

  // 1. Xác định media type và original URLs
  const mblog = noteItem.mblog || noteItem;
  const isVideo = !!(mblog.page_info?.media_info?.stream_url || mblog.page_info?.media_info?.mp4_sd_url);
  const mediaType = isVideo ? "video" : (postRow.media_urls && postRow.media_urls.length > 1 ? "carousel" : "image");
  
  const originalMediaUrls = [...(postRow.media_urls || [])];
  const originalCoverUrl = postRow.cover_url || "";

  // 2. Xử lý R2 cache (removed)
  const mediaUrls: string[] = [...originalMediaUrls];
  let coverUrl = originalCoverUrl;
  
  let mediaSource = "original";
  let mediaStatus = "original_only";
  let mediaError: string | null = null;
  let mediaCachedAt: string | null = null;

  if (originalMediaUrls.length === 0 && !originalCoverUrl) {
    mediaSource = "none";
    mediaStatus = "unavailable";
  }

  // Cập nhật postRow với dữ liệu mới
  postRow.media_type = mediaType;
  postRow.media_urls = mediaUrls;
  postRow.cover_url = coverUrl || undefined;
  postRow.original_media_urls = originalMediaUrls;
  postRow.original_cover_url = originalCoverUrl || undefined;
  postRow.media_status = mediaStatus;
  postRow.media_source = mediaSource;
  postRow.media_error = mediaError;
  postRow.media_cached_at = mediaCachedAt || undefined;

  await upsertPost(postRow);
  const uuid = await getPostUuid("weibo", postRow.platform_id);
  if (!uuid) {
    throw new Error(`Không thể lấy UUID của bài đăng vừa chèn: ${postRow.platform_id}`);
  }
  return uuid;
}

export class WeiboCrawler implements ICrawler {
  private client: WeiboClient;
  private currentAccountId: string | null = null;

  constructor() {
    this.client = new WeiboClient();
  }

  async ensureLogin(): Promise<void> {
    throw new Error("browser mode removed, provide valid cookie/session");
  }

  async releaseAccount(isSuccessful: boolean): Promise<void> {
    if (this.currentAccountId) {
      await checkinAccount(this.currentAccountId, isSuccessful);
      this.currentAccountId = null;
    }
  }

  /**
   * # Thực hiện cào chi tiết bài đăng Weibo
   */
  async crawl(target: string): Promise<void> {
    let success = false;
    try {
      let noteId = target;
      if (target.includes("/detail/")) {
        const match = target.match(/\/detail\/(\d+)/);
        if (match) noteId = match[1];
      }

      await this.ensureLogin();
      const noteItem = await this.client.getNoteInfoById(noteId);
      if (!noteItem || !noteItem.mblog) {
        throw new Error(`Không tìm thấy thông tin chi tiết cho bài đăng: ${noteId}`);
      }

      let authorUuid: string | undefined;
      const mblog = noteItem.mblog;
      if (mblog.user) {
        authorUuid = await persistAuthor(mblog.user);
      }

      const postUuid = await persistPost(noteItem, authorUuid);

      // Cào bình luận nếu được cấu hình
      if (process.env.ENABLE_GET_COMMENTS !== "false") {
        await this.client.getNoteAllComments(
          noteId,
          2.0,
          async (_, comments) => {
            const commentRows = comments.map(c => WeiboExtractor.extractComment(c, noteId, postUuid));
            await upsertComments(commentRows);
          },
          50
        );
      }
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Thực hiện cào profile creator và bài đăng của họ trên Weibo
   */
  async creator(target: string): Promise<void> {
    let success = false;
    try {
      const creatorId = target;
      await this.ensureLogin();

      // Cào thông tin tác giả
      const creatorInfoRes = await this.client.getCreatorInfoById(creatorId);
      const userInfo = creatorInfoRes?.userInfo;
      if (!userInfo) {
        throw new Error(`Không lấy được thông tin creator: ${creatorId}`);
      }

      const authorUuid = await persistAuthor(userInfo);
      const containerInfo = await this.client.getCreatorContainerInfo(creatorId);

      // Cào danh sách bài viết
      const allNotes = await this.client.getAllNotesByCreatorId(
        creatorId,
        containerInfo.lfid_container_id,
        2.0,
        async (notes) => {
          for (const noteItem of notes) {
            const postUuid = await persistPost(noteItem, authorUuid);
            
            // Cào bình luận cho từng bài viết của creator
            if (process.env.ENABLE_GET_COMMENTS !== "false" && noteItem.mblog?.id) {
              const noteId = String(noteItem.mblog.id);
              await this.client.getNoteAllComments(
                noteId,
                2.0,
                async (_, comments) => {
                  const commentRows = comments.map(c => WeiboExtractor.extractComment(c, noteId, postUuid));
                  await upsertComments(commentRows);
                },
                20 // giới hạn bình luận của creator để tránh rate limit
              );
            }
          }
        }
      );

      console.log(`Đã hoàn thành cào ${allNotes.length} bài viết của Creator: ${creatorId}`);
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Tìm kiếm bài đăng Weibo theo từ khóa
   */
  async search(keyword: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      const limit = maxCount || 20;
      await this.ensureLogin();

      let page = 1;
      let crawledCount = 0;
      let hasMore = true;

      while (hasMore && crawledCount < limit) {
        console.log(`Đang tìm kiếm từ khóa "${keyword}", trang ${page}...`);
        const searchRes = await this.client.getNoteByKeyword(keyword, page, WeiboSearchType.DEFAULT);
        if (!searchRes || !searchRes.cards) {
          break;
        }

        const cards: any[] = searchRes.cards;
        // Trích xuất các bài viết
        const noteItems: any[] = [];
        for (const card of cards) {
          if (card.card_type === 9) {
            noteItems.push(card);
          }
          if (card.card_group && Array.isArray(card.card_group)) {
            for (const item of card.card_group) {
              if (item.card_type === 9) {
                noteItems.push(item);
              }
            }
          }
        }

        if (noteItems.length === 0) {
          break;
        }

        for (const noteItem of noteItems) {
          if (crawledCount >= limit) {
            break;
          }

          const mblog = noteItem.mblog;
          if (!mblog) continue;

          let authorUuid: string | undefined;
          if (mblog.user) {
            authorUuid = await persistAuthor(mblog.user);
          }

          const postUuid = await persistPost(noteItem, authorUuid);

          // Cào bình luận của bài viết tìm kiếm được
          if (process.env.ENABLE_GET_COMMENTS !== "false" && mblog.id) {
            const noteId = String(mblog.id);
            await this.client.getNoteAllComments(
              noteId,
              2.0,
              async (_, comments) => {
                const commentRows = comments.map(c => WeiboExtractor.extractComment(c, noteId, postUuid));
                await upsertComments(commentRows);
              },
              10
            );
          }

          crawledCount++;
        }

        page++;
        hasMore = searchRes.cardlistInfo?.total > page * 10;
        await new Promise(r => setTimeout(r, 2000));
      }

      console.log(`Đã hoàn thành tìm kiếm. Tổng số bài viết thu được: ${crawledCount}`);
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Cào bình luận của bài đăng Weibo
   */
  async comments(target: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      const noteId = target;
      const limit = maxCount || 50;
      await this.ensureLogin();

      const postUuid = await getPostUuid("weibo", noteId);

      await this.client.getNoteAllComments(
        noteId,
        2.0,
        async (_, comments) => {
          const commentRows = comments.map(c => WeiboExtractor.extractComment(c, noteId, postUuid));
          await upsertComments(commentRows);
        },
        limit
      );

      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }
}
