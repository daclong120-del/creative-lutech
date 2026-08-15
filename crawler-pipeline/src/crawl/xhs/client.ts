/**
 * # API client cho XHS — gửi HTTP request đến XHS API
 * Chữ ký bắt buộc: X-s, X-t, X-s-common
 */

import type { IApiClient, RequestOptions, CookieData } from "../../base/base_client.js";
// playwright Page import removed
import { CONFIG } from "../../config.js";
import { ProxyAgent } from "undici";
import { XhsExtractor } from "./extractor.js";
import { signXhsRequest } from "./signer.js";

let dispatcher: ProxyAgent | undefined;
if (CONFIG.proxy) {
  dispatcher = new ProxyAgent(CONFIG.proxy);
}

type XhsCookieInput = CookieData[] | Record<string, string> | string;

export class XhsClient implements IApiClient {
  private cookies: CookieData[] = [];
  private headers: Record<string, string> = {};
  private _host: string = process.env.XHS_API_HOST || "https://webapi.rednote.com";

  constructor(options?: { proxy?: string; headers?: Record<string, string> }) {
    this.headers = {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.xiaohongshu.com/",
      "Origin": "https://www.xiaohongshu.com",
      "Content-Type": "application/json;charset=UTF-8",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      ...options?.headers,
    };
  }

  // setPage method removed

  /**
   * # Sinh chữ ký XHS thông qua kết hợp Playwright Page và thuật toán cục bộ
   */
  async sign(
    uri: string,
    method: string,
    data?: any
  ): Promise<{ "X-S": string; "X-T": string; "x-S-Common": string; "X-B3-Traceid": string }> {
    return signXhsRequest({
      method,
      uri,
      data,
      cookie: this.getCookieString(),
    });
  }

  /**
   * # Sinh chuỗi x-s-common
   */
  /**
   * # Gửi request đến XHS API (cần chữ ký X-s, X-t)
   */
  async request(method: string, url: string, options?: RequestOptions): Promise<any> {
    let finalUrl = url;
    if (!url.startsWith("http")) {
      finalUrl = `${this._host}${url}`;
    }

    const parsedUrl = new URL(finalUrl);
    const uri = parsedUrl.pathname;

    let sigHeaders: Record<string, string> = {};
    if (options?.sign !== false) {
      let signData: any = undefined;
      if (method.toUpperCase() === "POST") {
        signData = options?.body;
      } else {
        const paramsObj: Record<string, string | string[]> = {};
        parsedUrl.searchParams.forEach((value, key) => {
          if (paramsObj[key]) {
            if (Array.isArray(paramsObj[key])) {
              (paramsObj[key] as string[]).push(value);
            } else {
              paramsObj[key] = [paramsObj[key] as string, value];
            }
          } else {
            paramsObj[key] = value;
          }
        });
        signData = paramsObj;
      }

      sigHeaders = await this.sign(uri, method, signData);
    }

    const cookieStr = this.getCookieString();
    const requestHeaders = {
      ...this.headers,
      ...sigHeaders,
      ...options?.headers,
      ...(cookieStr ? { Cookie: cookieStr } : {}),
    };

    const fetchOpts: any = {
      method,
      headers: requestHeaders,
    };

    if (options?.body) {
      fetchOpts.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    if (dispatcher) {
      fetchOpts.dispatcher = dispatcher;
    }

    const response = await fetch(finalUrl, fetchOpts);
    const responseText = await response.text();

    if (response.status === 471 || response.status === 461) {
      throw new Error(`CAPTCHA xuất hiện, yêu cầu thất bại (461/471). Phản hồi: ${responseText}`);
    }

    if (response.status !== 200) {
      throw new Error(`HTTP Status ${response.status}: ${responseText}`);
    }

    if (!responseText.trim().startsWith("{")) {
      return responseText;
    }

    try {
      const data = JSON.parse(responseText);
      if (data.success === false) {
        throw new Error(data.msg || JSON.stringify(data));
      }
      return data.data !== undefined ? data.data : (data.success !== undefined ? data.success : data);
    } catch (err) {
      throw new Error(
        `Lỗi phân tích JSON phản hồi: ${(err as Error).message}. Phản hồi: ${responseText.substring(0, 200)}`
      );
    }
  }

  /**
   * # Kiểm tra trạng thái đăng nhập qua API selfinfo
   */
  async pong(): Promise<boolean> {
    try {
      const selfInfo = await this.request("GET", "/api/sns/web/v1/user/selfinfo");
      return Boolean(selfInfo?.result?.success ?? selfInfo);
    } catch (e) {
      console.warn("[XhsClient.pong] Gặp lỗi kiểm tra ping:", (e as Error).message);
      return false;
    }
  }

  /**
   * # Cập nhật cookies từ browser context
   */
  async updateCookies(cookies: XhsCookieInput): Promise<void> {
    this.cookies = this.normalizeCookies(cookies);
    const cookieStr = this.getCookieString();
    this.headers["Cookie"] = cookieStr;
  }

  /**
   * # Lấy danh sách cookies hiện tại
   */
  getActiveCookies(): CookieData[] {
    return this.cookies;
  }

  private normalizeCookies(cookies: XhsCookieInput): CookieData[] {
    if (Array.isArray(cookies)) {
      return cookies
        .filter((cookie) => cookie?.name)
        .map((cookie) => ({
          ...cookie,
          value: String(cookie.value ?? ""),
        }));
    }

    if (typeof cookies === "string") {
      const cookieMap: Record<string, string> = {};
      for (const part of cookies.split(";")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const name = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (name) {
          cookieMap[name] = value;
        }
      }
      return this.normalizeCookies(cookieMap);
    }

    return Object.entries(cookies)
      .filter(([name]) => Boolean(name))
      .map(([name, value]) => ({
        name,
        value: String(value ?? ""),
        domain: ".xiaohongshu.com",
        path: "/",
      }));
  }

  private getCookieString(): string {
    return this.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  }

  /**
   * # Helper GET request
   */
  async get(uri: string, params?: Record<string, any>): Promise<any> {
    let queryStr = "";
    if (params) {
      const parts = [];
      for (const [key, value] of Object.entries(params)) {
        let valStr = "";
        if (Array.isArray(value)) {
          valStr = value.join(",");
        } else if (value !== null && value !== undefined) {
          valStr = String(value);
        }
        const encodedVal = encodeURIComponent(valStr).replace(/%2C/g, ",");
        parts.push(`${key}=${encodedVal}`);
      }
      if (parts.length > 0) {
        queryStr = `?${parts.join("&")}`;
      }
    }
    return this.request("GET", `${uri}${queryStr}`);
  }

  /**
   * # Helper POST request
   */
  async post(uri: string, data: Record<string, any>): Promise<any> {
    return this.request("POST", uri, { body: data });
  }

  /**
   * # Tìm kiếm bài viết theo từ khóa
   */
  async getNoteByKeyword(options: {
    keyword: string;
    searchId?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    noteType?: string | number;
  }): Promise<any> {
    const uri = "/api/sns/web/v1/search/notes";
    const data = {
      keyword: options.keyword,
      page: options.page || 1,
      page_size: options.pageSize || 20,
      search_id: options.searchId || "0",
      sort: options.sort || "general",
      note_type: options.noteType ?? 0,
    };
    return this.post(uri, data);
  }

  /**
   * # Lấy thông tin chi tiết bài viết từ API feed
   */
  async getNoteById(noteId: string, xsecSource: string = "pc_search", xsecToken: string = ""): Promise<any> {
    const data = {
      source_note_id: noteId,
      image_formats: ["jpg", "webp", "avif"],
      extra: { need_body_topic: 1 },
      xsec_source: xsecSource || "pc_search",
      xsec_token: xsecToken,
    };
    const uri = "/api/sns/web/v1/feed";
    const res = await this.post(uri, data);
    if (res && res.items && res.items.length > 0) {
      return res.items[0].note_card || res.items[0].noteCard || {};
    }
    console.error(`[XhsClient.getNoteById] Note detail empty for ID ${noteId}`);
    return {};
  }

  /**
   * # Lấy thông tin chi tiết bài viết qua HTML explore (fallback)
   */
  async getNoteByIdFromHtml(
    noteId: string,
    xsecSource: string,
    xsecToken: string,
    enableCookie: boolean = false
  ): Promise<any> {
    const url = `https://www.xiaohongshu.com/explore/${noteId}?xsec_token=${xsecToken}&xsec_source=${xsecSource}`;
    const copyHeaders = { ...this.headers };
    if (!enableCookie) {
      delete copyHeaders["Cookie"];
      delete copyHeaders["cookie"];
    }
    const html = await this.request("GET", url, { headers: copyHeaders, sign: false });
    return XhsExtractor.extractNoteDetailFromHtml(noteId, html);
  }

  /**
   * # Lấy danh sách bình luận cấp 1
   */
  async getNoteComments(noteId: string, xsecToken: string, cursor: string = ""): Promise<any> {
    const uri = "/api/sns/web/v2/comment/page";
    const params = {
      note_id: noteId,
      cursor,
      top_comment_id: "",
      image_formats: "jpg,webp,avif",
      xsec_token: xsecToken,
      need_translation: "1",
    };
    return this.get(uri, params);
  }

  /**
   * # Lấy danh sách bình luận con cấp 2
   */
  async getNoteSubComments(
    noteId: string,
    rootCommentId: string,
    xsecToken: string,
    num: number = 10,
    cursor: string = ""
  ): Promise<any> {
    const uri = "/api/sns/web/v2/comment/sub/page";
    const params = {
      note_id: noteId,
      root_comment_id: rootCommentId,
      num: String(num),
      cursor,
      image_formats: "jpg,webp,avif",
      top_comment_id: "",
      xsec_token: xsecToken,
      need_translation: "1",
    };
    return this.get(uri, params);
  }

  /**
   * # Lấy toàn bộ bình luận của bài đăng (đệ quy)
   */
  async getNoteAllComments(options: {
    noteId: string;
    xsecToken: string;
    crawlInterval?: number;
    callback?: (noteId: string, comments: any[]) => Promise<void>;
    maxCount?: number;
  }): Promise<any[]> {
    const result: any[] = [];
    const maxCount = options.maxCount || 10;
    const crawlInterval = options.crawlInterval || 1;
    let commentsHasMore = true;
    let commentsCursor = "";

    while (commentsHasMore && result.length < maxCount) {
      const commentsRes = await this.getNoteComments(options.noteId, options.xsecToken, commentsCursor);
      commentsHasMore = commentsRes.has_more || commentsRes.hasMore || false;
      commentsCursor = commentsRes.cursor || "";
      if (!commentsRes.comments) {
        break;
      }
      let comments = commentsRes.comments;
      if (result.length + comments.length > maxCount) {
        comments = comments.slice(0, maxCount - result.length);
      }
      if (options.callback) {
        await options.callback(options.noteId, comments);
      }
      await new Promise((r) => setTimeout(r, crawlInterval * 1000));
      result.push(...comments);

      // Cào bình luận con cấp 2
      const subComments = await this.getCommentsAllSubComments({
        comments,
        xsecToken: options.xsecToken,
        crawlInterval,
        callback: options.callback,
      });
      result.push(...subComments);
    }
    return result;
  }

  /**
   * # Lấy toàn bộ bình luận con dưới các bình luận cấp 1
   */
  async getCommentsAllSubComments(options: {
    comments: any[];
    xsecToken: string;
    crawlInterval?: number;
    callback?: (noteId: string, comments: any[]) => Promise<void>;
  }): Promise<any[]> {
    const result: any[] = [];
    const crawlInterval = options.crawlInterval || 1;
    for (const comment of options.comments) {
      try {
        const noteId = comment.note_id || comment.noteId;
        const subComments = comment.sub_comments || comment.subComments;
        if (subComments && options.callback) {
          await options.callback(noteId, subComments);
        }
        let subCommentHasMore = comment.sub_comment_has_more || comment.subCommentHasMore;
        if (!subCommentHasMore) {
          continue;
        }
        const rootCommentId = comment.id || comment.comment_id || comment.commentId;
        let subCommentCursor = comment.sub_comment_cursor || comment.subCommentCursor || "";

        while (subCommentHasMore) {
          try {
            const commentsRes = await this.getNoteSubComments(
              noteId,
              rootCommentId,
              options.xsecToken,
              10,
              subCommentCursor
            );
            if (!commentsRes) {
              break;
            }
            subCommentHasMore = commentsRes.has_more || commentsRes.hasMore || false;
            subCommentCursor = commentsRes.cursor || "";
            if (!commentsRes.comments) {
              break;
            }
            const comments = commentsRes.comments;
            if (options.callback) {
              await options.callback(noteId, comments);
            }
            await new Promise((r) => setTimeout(r, crawlInterval * 1000));
            result.push(...comments);
          } catch (e) {
            console.warn(`[XhsClient.getCommentsAllSubComments] Error fetching sub comments:`, e);
            break;
          }
        }
      } catch (e) {
        console.error(`[XhsClient.getCommentsAllSubComments] Error processing comment:`, e);
      }
    }
    return result;
  }

  /**
   * # Lấy thông tin creator qua parse HTML profile
   */
  async getCreatorInfo(userId: string, xsecToken: string = "", xsecSource: string = ""): Promise<any> {
    let uri = `/user/profile/${userId}`;
    if (xsecToken && xsecSource) {
      uri = `${uri}?xsec_token=${xsecToken}&xsec_source=${xsecSource}`;
    }
    const htmlContent = await this.request("GET", `https://www.xiaohongshu.com${uri}`, { sign: false });
    return XhsExtractor.extractCreatorInfoFromHtml(htmlContent);
  }

  /**
   * # Lấy các bài viết của creator (phân trang)
   */
  async getNotesByCreator(
    userId: string,
    cursor: string = "",
    pageSize: number = 30,
    xsecToken: string = "",
    xsecSource: string = "pc_feed"
  ): Promise<any> {
    const uri = "/api/sns/web/v1/user_posted";
    const params = {
      num: pageSize,
      cursor,
      user_id: userId,
      image_formats: "jpg,webp,avif",
      xsec_token: xsecToken,
      xsec_source: xsecSource,
    };
    return this.get(uri, params);
  }

  /**
   * # Lấy tất cả bài viết của creator
   */
  async getAllNotesByCreator(options: {
    userId: string;
    crawlInterval?: number;
    callback?: (notes: any[]) => Promise<void>;
    xsecToken?: string;
    xsecSource?: string;
    maxCount?: number;
  }): Promise<any[]> {
    const result: any[] = [];
    const maxCount = options.maxCount || 100;
    const crawlInterval = options.crawlInterval || 1;
    let notesHasMore = true;
    let notesCursor = "";

    while (notesHasMore && result.length < maxCount) {
      const notesRes = await this.getNotesByCreator(
        options.userId,
        notesCursor,
        30,
        options.xsecToken || "",
        options.xsecSource || "pc_feed"
      );
      if (!notesRes) {
        break;
      }
      notesHasMore = notesRes.has_more || notesRes.hasMore || false;
      notesCursor = notesRes.cursor || "";
      if (!notesRes.notes) {
        break;
      }
      const notes = notesRes.notes;
      const remaining = maxCount - result.length;
      if (remaining <= 0) {
        break;
      }
      const notesToAdd = notes.slice(0, remaining);
      if (options.callback) {
        await options.callback(notesToAdd);
      }
      result.push(...notesToAdd);
      await new Promise((r) => setTimeout(r, crawlInterval * 1000));
    }
    return result;
  }
}
