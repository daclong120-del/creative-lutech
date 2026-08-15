/**
 * # Crawler chính cho Tieba (百度贴吧) — điều phối search, detail, creator, comments
 */

import { TiebaClient } from "./client.js";
import {
  upsertAuthor,
  upsertPost,
  upsertPosts,
  upsertComments,
  getPostUuid,
  checkoutAccount,
  checkinAccount,
  updateTaskProgress,
} from "../../store/index.js";
import { CrawledPostRow } from "../../model/storage.js";
import type { ICrawler } from "../../base/base_crawler.js";
import { CONFIG } from "../../config.js";
import { parseCookieString } from "../../utils/crawler.js";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { TiebaNote, TiebaComment, TiebaCreator } from "../../model/tieba.js";

async function downloadMedia(url: string): Promise<Buffer> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  if (!resp.ok) {
    throw new Error(`Tải ảnh thất bại: status ${resp.status}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

async function persistAuthor(authorInfo: {
  uid: string;
  nickname: string;
  avatarUrl?: string;
  gender?: string;
  description?: string;
  followsCount?: number;
  fansCount?: number;
  interactionCount?: number;
  ipLocation?: string;
  raw?: any;
}): Promise<string> {
  return await upsertAuthor({
    platform: "tieba",
    platform_uid: authorInfo.uid,
    nickname: authorInfo.nickname,
    avatar_url: authorInfo.avatarUrl || undefined,
    gender: authorInfo.gender,
    description: authorInfo.description,
    follows_count: authorInfo.followsCount,
    fans_count: authorInfo.fansCount,
    interaction_count: authorInfo.interactionCount,
    ip_location: authorInfo.ipLocation,
    raw: authorInfo.raw,
  });
}

async function persistPost(note: TiebaNote, authorUuid?: string): Promise<string> {
  const mediaUrls = note.media_urls || [];
  const coverUrl = note.cover_url || mediaUrls[0] || undefined;
  const mediaType = note.media_type || (mediaUrls.length > 1 ? "carousel" : (mediaUrls.length === 1 ? "image" : "unknown"));
  const mediaStatus = mediaUrls.length > 0 ? "original_only" : "unavailable";

  const postData: CrawledPostRow = {
    platform: "tieba",
    platform_id: note.note_id || "",
    author_id: authorUuid,
    title: note.title || undefined,
    caption: `${note.title || ""}\n${note.desc || ""}`.trim(),
    media_urls: mediaUrls,
    cover_url: coverUrl,
    stats: {
      digg_count: 0,
      comment_count: note.total_replay_num || 0,
      share_count: 0,
      play_count: 0,
    },
    raw: note,
    published_at: note.publish_time || new Date().toISOString(),
    media_type: mediaType,
    content_type: "post",
    source_url: note.note_url,
    original_media_urls: note.original_media_urls || mediaUrls,
    original_cover_url: note.original_cover_url || coverUrl,
    media_status: mediaStatus,
    media_source: mediaUrls.length > 0 ? "original" : "none",
  };

  await upsertPost(postData);
  const uuid = await getPostUuid("tieba", note.note_id || "");
  if (!uuid) {
    throw new Error(`Failed to retrieve UUID for inserted note: ${note.note_id}`);
  }
  return uuid;
}

function mapTiebaComment(c: TiebaComment, platformPostId: string, postUuid?: string) {
  let uid = "";
  if (c.user_link) {
    const match = c.user_link.match(/[?&]id=([^&]+)/);
    if (match) {
      uid = decodeURIComponent(match[1]);
    }
  }

  return {
    platform: "tieba",
    platform_cid: c.comment_id || "",
    post_id: postUuid,
    platform_post_id: platformPostId,
    parent_cid: c.parent_comment_id || undefined,
    author_uid: uid || c.user_nickname || "",
    author_nickname: c.user_nickname || "",
    content: c.content || "",
    like_count: 0,
    raw: c,
    published_at: c.publish_time ? new Date(c.publish_time).toISOString() : new Date().toISOString(),
  };
}

export class TiebaCrawler implements ICrawler {
  private client: TiebaClient;
  private currentAccountId: string | null = null;

  constructor() {
    this.client = new TiebaClient();
  }

  async ensureLogin(): Promise<void> {
    return;
  }

  async releaseAccount(isSuccessful: boolean): Promise<void> {
    if (this.currentAccountId) {
      await checkinAccount(this.currentAccountId, isSuccessful);
      this.currentAccountId = null;
    }
  }

  /**
   * # Thực hiện cào chi tiết bài đăng Tieba
   */
  async crawl(target: string): Promise<void> {
    let success = false;
    try {
      let noteId = target;
      if (target.includes("/p/")) {
        const match = target.match(/\/p\/(\d+)/);
        if (match) noteId = match[1];
      }

      await this.ensureLogin();
      const note = await this.client.getNoteById(noteId);

      let authorUuid: string | undefined;
      if (note.user_link) {
        let uid = "";
        const match = note.user_link.match(/[?&]id=([^&]+)/);
        if (match) uid = decodeURIComponent(match[1]);
        if (uid) {
          authorUuid = await persistAuthor({
            uid,
            nickname: note.user_nickname || "",
            avatarUrl: note.user_avatar,
            ipLocation: note.ip_location,
            raw: note,
          });
        }
      }

      const postUuid = await persistPost(note, authorUuid);

      if (process.env.ENABLE_GET_COMMENTS !== "false") {
        const maxComments = process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES
          ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10)
          : 50;

        const callback = async (nid: string, comments: TiebaComment[]) => {
          const mapped = comments.map(c => mapTiebaComment(c, nid, postUuid));
          await upsertComments(mapped);
        };

        await this.client.getNoteAllComments(note, 1.0, callback, maxComments);
      }

      success = true;
    } catch (e) {
      console.error("[TiebaCrawler.crawl] Error:", e);
      throw e;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Thực hiện cào profile creator và danh sách bài đăng của họ trên Tieba
   */
  async creator(target: string): Promise<void> {
    let success = false;
    try {
      await this.ensureLogin();
      const creatorInfo = await this.client.getCreatorInfoByUrl(target);

      const authorUuid = await persistAuthor({
        uid: creatorInfo.user_id || "",
        nickname: creatorInfo.nickname || creatorInfo.user_name || "",
        avatarUrl: creatorInfo.avatar,
        gender: creatorInfo.gender,
        description: `Đăng ký: ${creatorInfo.registration_duration || ""}`,
        followsCount: Number(creatorInfo.follows || 0),
        fansCount: Number(creatorInfo.fans || 0),
        ipLocation: creatorInfo.ip_location,
        raw: creatorInfo,
      });

      const maxPosts = process.env.CREATOR_MAX_POSTS ? parseInt(process.env.CREATOR_MAX_POSTS, 10) : 20;
      const notes = await this.client.getAllNotesByCreatorUrl(target, 1.0, undefined, maxPosts);

      for (const note of notes) {
        const postUuid = await persistPost(note, authorUuid);
        if (process.env.ENABLE_GET_COMMENTS !== "false") {
          const maxComments = process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES
            ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10)
            : 50;

          const callback = async (nid: string, comments: TiebaComment[]) => {
            const mapped = comments.map(c => mapTiebaComment(c, nid, postUuid));
            await upsertComments(mapped);
          };

          await this.client.getNoteAllComments(note, 1.0, callback, maxComments);
        }
      }

      success = true;
    } catch (e) {
      console.error("[TiebaCrawler.creator] Error:", e);
      throw e;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Tìm kiếm bài đăng Tieba theo từ khóa
   */
  async search(keyword: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      await this.ensureLogin();
      const limit = maxCount || 20;
      const pageSize = 20;
      const maxPages = Math.max(10, Math.ceil(limit / pageSize) + 5);
      const seenNoteIds = new Set<string>();
      let savedCount = 0;
      let page = 1;
      let emptyPages = 0;

      while (savedCount < limit && page <= maxPages) {
        const searchNotes = await this.client.getNotesByKeyword(keyword, page, pageSize);
        if (searchNotes.length === 0) {
          emptyPages++;
          if (emptyPages >= 2) {
            break;
          }
          page++;
          continue;
        }

        let newCandidatesOnPage = 0;
        for (const searchNote of searchNotes) {
          if (savedCount >= limit) {
            break;
          }

          const noteId = searchNote.note_id;
          if (!noteId || seenNoteIds.has(noteId)) {
            continue;
          }

          seenNoteIds.add(noteId);
          newCandidatesOnPage++;

          let note: TiebaNote;
          try {
            note = await this.client.getNoteById(noteId);
          } catch (err: any) {
            console.warn(`[TiebaCrawler.search] Skip note ${noteId}: ${err.message}`);
            continue;
          }

          let authorUuid: string | undefined;
          if (note.user_link) {
            let uid = "";
            const match = note.user_link.match(/[?&]id=([^&]+)/);
            if (match) uid = decodeURIComponent(match[1]);
            if (uid) {
              authorUuid = await persistAuthor({
                uid,
                nickname: note.user_nickname || "",
                avatarUrl: note.user_avatar,
                ipLocation: note.ip_location,
                raw: note,
              });
            }
          }

          const postUuid = await persistPost(note, authorUuid);
          savedCount++;
          await updateTaskProgress(process.env.CURRENT_TASK_ID, savedCount, limit);

          if (process.env.ENABLE_GET_COMMENTS !== "false") {
            const maxComments = process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES
              ? parseInt(process.env.CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES, 10)
              : 50;

            const callback = async (nid: string, comments: TiebaComment[]) => {
              const mapped = comments.map(c => mapTiebaComment(c, nid, postUuid));
              await upsertComments(mapped);
            };

            await this.client.getNoteAllComments(note, 1.0, callback, maxComments);
          }
        }

        if (newCandidatesOnPage === 0) {
          emptyPages++;
          if (emptyPages >= 2) {
            break;
          }
        } else {
          emptyPages = 0;
        }

        page++;
      }

      if (savedCount < limit) {
        console.warn(`[TiebaCrawler.search] Only saved ${savedCount}/${limit} posts for keyword "${keyword}" after ${page - 1} search pages.`);
      }

      success = true;
    } catch (e) {
      console.error("[TiebaCrawler.search] Error:", e);
      throw e;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Cào bình luận của bài đăng Tieba
   */
  async comments(target: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      let noteId = "";
      if (target.includes("/p/")) {
        const match = target.match(/\/p\/(\d+)/);
        if (match) noteId = match[1];
      } else if (/^\d+$/.test(target.trim())) {
        noteId = target.trim();
      }

      await this.ensureLogin();
      const limit = maxCount || 50;
      let remaining = limit;
      let notes: TiebaNote[];

      if (noteId) {
        notes = [await this.client.getNoteById(noteId)];
      } else {
        const searchNotes = await this.client.getNotesByKeyword(target, 1, Math.min(5, Math.max(1, limit)));
        if (searchNotes.length === 0) {
          throw new Error(`No Tieba posts found for keyword: ${target}`);
        }
        notes = (await Promise.all(
          searchNotes
            .filter(note => note.note_id)
            .map(note => this.client.getNoteById(note.note_id!))
        )).filter(Boolean);
      }

      for (const note of notes) {
        if (remaining <= 0) {
          break;
        }

        const platformPostId = note.note_id || noteId;
        let postUuid = await getPostUuid("tieba", platformPostId);
        if (!postUuid) {
          postUuid = await persistPost(note);
        }

        const callback = async (nid: string, comments: TiebaComment[]) => {
          const mapped = comments.map(c => mapTiebaComment(c, nid, postUuid));
          await upsertComments(mapped);
        };

        const comments = await this.client.getNoteAllComments(note, 1.0, callback, remaining);
        remaining -= comments.length;
      }
      success = true;
    } catch (e) {
      console.error("[TiebaCrawler.comments] Error:", e);
      throw e;
    } finally {
      await this.releaseAccount(success);
    }
  }
}
