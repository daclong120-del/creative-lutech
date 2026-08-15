/**
 * # Crawler chính cho XHS (小红书) — điều phối search, detail, creator, comments
 */

import { XhsClient } from "./client.js";
import { XhsExtractor } from "./extractor.js";
import {
  upsertAuthor,
  upsertPost,
  upsertPosts,
  upsertComments,
  getPostUuid,
  checkoutAccount,
  checkinAccount,
} from "../../store/index.js";
import type { ICrawler } from "../../base/base_crawler.js";
import { CONFIG } from "../../config.js";
import { parseCookieString } from "../../utils/crawler.js";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";

interface NoteUrlInfo {
  noteId: string;
  xsecSource: string;
  xsecToken: string;
}

interface CreatorUrlInfo {
  userId: string;
  xsecSource: string;
  xsecToken: string;
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const parsed = new URL(url);
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (e) {
    const queryPart = url.split("?")[1];
    if (queryPart) {
      const pairs = queryPart.split("&");
      for (const pair of pairs) {
        const [k, v] = pair.split("=");
        if (k) {
          params[decodeURIComponent(k)] = decodeURIComponent(v || "");
        }
      }
    }
  }
  return params;
}

function parseNoteInfoFromUrl(url: string): NoteUrlInfo {
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith("http")) {
    const pathPart = cleanUrl.split("?")[0];
    const noteId = pathPart.split("/").pop() || "";
    const params = parseUrlParams(cleanUrl);
    return {
      noteId,
      xsecSource: params.xsec_source || "pc_search",
      xsecToken: params.xsec_token || "",
    };
  } else {
    return {
      noteId: cleanUrl,
      xsecSource: "pc_search",
      xsecToken: "",
    };
  }
}

function parseCreatorInfoFromUrl(url: string): CreatorUrlInfo {
  const cleanUrl = url.trim();
  if (cleanUrl.length === 24 && /^[0-9a-fA-F]+$/.test(cleanUrl)) {
    return {
      userId: cleanUrl,
      xsecSource: "pc_feed",
      xsecToken: "",
    };
  }

  const match = cleanUrl.match(/\/user\/profile\/([^/?]+)/);
  if (match) {
    const userId = match[1];
    const params = parseUrlParams(cleanUrl);
    return {
      userId,
      xsecSource: params.xsec_source || "pc_feed",
      xsecToken: params.xsec_token || "",
    };
  }

  throw new Error(`Unable to parse creator info from URL: ${url}`);
}

function base36encode(number: bigint, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"): string {
  let num = number;
  let base36 = "";
  let sign = "";

  if (num < 0n) {
    sign = "-";
    num = -num;
  }

  const base = BigInt(alphabet.length);
  if (num === 0n) {
    return alphabet[0];
  }

  while (num > 0n) {
    const i = Number(num % base);
    num = num / base;
    base36 = alphabet[i] + base36;
  }

  return sign + base36;
}

function getSearchId(): string {
  const timestamp = BigInt(Date.now()) << 64n;
  const rand = BigInt(Math.floor(Math.random() * 2147483646));
  return base36encode(timestamp + rand);
}

async function loadLocalXhsCookie(): Promise<string> {
  if (process.env.XHS_COOKIE) {
    return process.env.XHS_COOKIE;
  }

  try {
    const sessionPath = join(process.cwd(), "output", "xhs_session.json");
    const content = await readFile(sessionPath, "utf8");
    const data = JSON.parse(content);
    if (typeof data.cookie === "string") {
      return data.cookie;
    }
    if (typeof data.cookieString === "string") {
      return data.cookieString;
    }
    if (Array.isArray(data.cookies)) {
      return data.cookies
        .map((cookie: any) => `${cookie.name || cookie.key}=${cookie.value || ""}`)
        .filter((part: string) => !part.startsWith("="))
        .join("; ");
    }
    if (data && typeof data === "object") {
      return Object.entries(data)
        .filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => `${key}=${value ?? ""}`)
        .join("; ");
    }
  } catch {}

  return "";
}

function hasXhsSessionCookie(cookies: Record<string, string>): boolean {
  return Boolean(cookies.a1 && cookies.web_session);
}

async function downloadXhsMedia(url: string): Promise<Buffer> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!resp.ok) {
    throw new Error(`Không thể tải tài nguyên XHS: status ${resp.status}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

async function persistAuthor(rawCreator: any): Promise<string> {
  const authorRow = XhsExtractor.extractAuthor(rawCreator);
  return await upsertAuthor(authorRow);
}

async function persistPost(rawNote: any, authorUuid?: string): Promise<string> {
  const postRow = XhsExtractor.extractPost(rawNote, authorUuid);

  // 1. Xác định media type và original URLs
  const isVideo = !!XhsExtractor.extractVideoPlayUrl(rawNote);
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
  const uuid = await getPostUuid("xhs", postRow.platform_id);
  if (!uuid) {
    throw new Error(`Không thể lấy UUID của bài đăng vừa chèn: ${postRow.platform_id}`);
  }
  return uuid;
}

export class XhsCrawler implements ICrawler {
  private client: XhsClient;
  private currentAccountId: string | null = null;

  constructor() {
    this.client = new XhsClient();
  }

  async ensureLogin(): Promise<void> {
    if (this.currentAccountId) {
      return;
    }

    const seenAccountIds = new Set<string>();
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const account = await checkoutAccount("xhs");
      if (!account || seenAccountIds.has(account.id)) {
        break;
      }

      console.log(`Checking XHS account from pool: ${account.username} (ID: ${account.id})...`);
      seenAccountIds.add(account.id);
      this.currentAccountId = account.id;

      const accountCookies = parseCookieString(account.cookie_data);
      if (!hasXhsSessionCookie(accountCookies)) {
        console.warn(`XHS account ${account.username} is missing a1/web_session. Marking failure and trying the next account.`);
        await checkinAccount(account.id, false);
        this.currentAccountId = null;
        continue;
      }

      await this.client.updateCookies(accountCookies);
      if (await this.client.pong()) {
        console.log(`XHS account ${account.username} passed diagnostic.`);
        return;
      }

      console.warn(`XHS account ${account.username} failed diagnostic. Marking failure and trying the next account.`);
      await checkinAccount(account.id, false);
      this.currentAccountId = null;
    }

    const localCookie = await loadLocalXhsCookie();
    if (localCookie) {
      console.log("No valid XHS account from pool. Trying XHS_COOKIE/output local session...");
      const localCookies = parseCookieString(localCookie);
      if (!hasXhsSessionCookie(localCookies)) {
        throw new Error("XHS local session is missing a1/web_session. Re-export cookies after logging in.");
      }
      await this.client.updateCookies(localCookies);
      if (await this.client.pong()) {
        console.log("XHS local session passed diagnostic.");
        return;
      }
    }

    await this.client.updateCookies([]);
    throw new Error("No valid XHS session. Update an active crawler_accounts cookie or XHS_COOKIE.");
  }

  async releaseAccount(isSuccessful: boolean): Promise<void> {
    if (this.currentAccountId) {
      await checkinAccount(this.currentAccountId, isSuccessful);
      this.currentAccountId = null;
    }
  }

  /**
   * # Thực hiện cào chi tiết bài đăng (note) trên XHS
   */
  async crawl(target: string): Promise<void> {
    let success = false;
    try {
      const urlInfo = parseNoteInfoFromUrl(target);
      await this.ensureLogin();

      let noteDetail = await this.client.getNoteById(urlInfo.noteId, urlInfo.xsecSource, urlInfo.xsecToken);
      if (!noteDetail || Object.keys(noteDetail).length === 0) {
        noteDetail = await this.client.getNoteByIdFromHtml(urlInfo.noteId, urlInfo.xsecSource, urlInfo.xsecToken, true);
      }

      if (!noteDetail || Object.keys(noteDetail).length === 0) {
        throw new Error(`Không tìm thấy thông tin chi tiết cho note XHS: ${urlInfo.noteId}`);
      }

      noteDetail.xsec_token = urlInfo.xsecToken;
      noteDetail.xsec_source = urlInfo.xsecSource;

      let authorUuid: string | undefined;
      if (noteDetail.user) {
        authorUuid = await persistAuthor(noteDetail.user);
      }

      const postUuid = await persistPost(noteDetail, authorUuid);

      if (process.env.ENABLE_GET_COMMENTS !== "false") {
        await this.client.getNoteAllComments({
          noteId: urlInfo.noteId,
          xsecToken: urlInfo.xsecToken,
          crawlInterval: 1.0,
          callback: async (_, comments) => {
            const commentRows = comments.map(c => XhsExtractor.extractComment(c, urlInfo.noteId, postUuid));
            await upsertComments(commentRows);
          },
          maxCount: 50
        });
      }
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Thực hiện cào profile creator và bài đăng của họ trên XHS
   */
  async creator(target: string): Promise<void> {
    let success = false;
    try {
      const creatorInfoUrl = parseCreatorInfoFromUrl(target);
      await this.ensureLogin();

      const creatorInfo = await this.client.getCreatorInfo(
        creatorInfoUrl.userId,
        creatorInfoUrl.xsecToken,
        creatorInfoUrl.xsecSource
      );
      if (!creatorInfo) {
        throw new Error(`Không lấy được thông tin creator XHS: ${creatorInfoUrl.userId}`);
      }

      const authorUuid = await persistAuthor(creatorInfo);

      const allNotes = await this.client.getAllNotesByCreator({
        userId: creatorInfoUrl.userId,
        crawlInterval: 2.0,
        xsecToken: creatorInfoUrl.xsecToken,
        xsecSource: creatorInfoUrl.xsecSource,
        maxCount: 20
      });

      for (const note of allNotes) {
        const noteId = note.note_id || note.id;
        if (!noteId) continue;

        let detailedNote = note;
        const xsecToken = note.xsec_token || note.xsecToken || "";
        const xsecSource = note.xsec_source || note.xsecSource || "pc_feed";

        try {
          const res = await this.client.getNoteById(noteId, xsecSource, xsecToken);
          if (res && Object.keys(res).length > 0) {
            detailedNote = res;
          }
        } catch (err) {
          console.warn(`[XhsCrawler] Không lấy được chi tiết note ${noteId}, sử dụng dữ liệu từ list.`);
        }

        detailedNote.xsec_token = xsecToken;
        detailedNote.xsec_source = xsecSource;

        const postUuid = await persistPost(detailedNote, authorUuid);

        if (process.env.ENABLE_GET_COMMENTS !== "false") {
          await this.client.getNoteAllComments({
            noteId,
            xsecToken,
            crawlInterval: 1.0,
            callback: async (_, comments) => {
              const commentRows = comments.map(c => XhsExtractor.extractComment(c, noteId, postUuid));
              await upsertComments(commentRows);
            },
            maxCount: 20
          });
        }
      }

      console.log(`Đã hoàn thành cào ${allNotes.length} note của Creator: ${creatorInfoUrl.userId}`);
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Tìm kiếm note trên XHS theo từ khóa
   */
  async search(keyword: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      const limit = maxCount || 20;
      await this.ensureLogin();

      let page = 1;
      let crawledCount = 0;
      let hasMore = true;
      const searchId = getSearchId();

      while (hasMore && crawledCount < limit) {
        console.log(`Đang tìm kiếm từ khóa "${keyword}" trên XHS, trang ${page}...`);
        const searchRes = await this.client.getNoteByKeyword({
          keyword,
          searchId,
          page,
          pageSize: 20
        });

        if (!searchRes || !searchRes.items) {
          console.warn(`[XhsCrawler] Lỗi hoặc không có kết quả tìm kiếm cho từ khóa: ${keyword}`);
          break;
        }

        hasMore = searchRes.has_more || searchRes.hasMore || false;
        const items = searchRes.items || [];
        if (items.length === 0) {
          hasMore = false;
          break;
        }

        for (const item of items) {
          if (crawledCount >= limit) {
            break;
          }
          if (item.model_type === "rec_query" || item.model_type === "hot_query") {
            continue;
          }

          const noteId = item.id || item.note_id;
          if (!noteId) continue;

          const xsecSource = item.xsec_source || item.xsecSource || "pc_search";
          const xsecToken = item.xsec_token || item.xsecToken || "";

          let authorUuid: string | undefined;
          if (item.note_card?.user || item.noteCard?.user) {
            authorUuid = await persistAuthor(item.note_card?.user || item.noteCard?.user);
          }

          let detailedNote = item.note_card || item.noteCard || item;
          try {
            const res = await this.client.getNoteById(noteId, xsecSource, xsecToken);
            if (res && Object.keys(res).length > 0) {
              detailedNote = res;
            }
          } catch (err) {
            console.warn(`[XhsCrawler] Không lấy được chi tiết cho note tìm kiếm ${noteId}`);
          }

          detailedNote.xsec_token = xsecToken;
          detailedNote.xsec_source = xsecSource;

          const postUuid = await persistPost(detailedNote, authorUuid);

          if (process.env.ENABLE_GET_COMMENTS !== "false") {
            await this.client.getNoteAllComments({
              noteId,
              xsecToken,
              crawlInterval: 1.0,
              callback: async (_, comments) => {
                const commentRows = comments.map(c => XhsExtractor.extractComment(c, noteId, postUuid));
                await upsertComments(commentRows);
              },
              maxCount: 10
            });
          }

          crawledCount++;
        }

        page++;
        await new Promise(r => setTimeout(r, 2000));
      }

      console.log(`Đã hoàn thành tìm kiếm cho từ khóa "${keyword}" với ${crawledCount} kết quả.`);
      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }

  /**
   * # Cào bình luận của note trên XHS
   */
  async comments(target: string, maxCount?: number): Promise<void> {
    let success = false;
    try {
      const urlInfo = parseNoteInfoFromUrl(target);
      const limit = maxCount || 50;
      await this.ensureLogin();

      const postUuid = await getPostUuid("xhs", urlInfo.noteId);
      if (!postUuid) {
        throw new Error(`Chưa cào bài đăng này, hãy cào bài đăng trước khi cào comment: ${urlInfo.noteId}`);
      }

      await this.client.getNoteAllComments({
        noteId: urlInfo.noteId,
        xsecToken: urlInfo.xsecToken,
        crawlInterval: 1.0,
        callback: async (_, comments) => {
          const commentRows = comments.map(c => XhsExtractor.extractComment(c, urlInfo.noteId, postUuid));
          await upsertComments(commentRows);
        },
         maxCount: limit
      });

      success = true;
    } finally {
      await this.releaseAccount(success);
    }
  }
}
