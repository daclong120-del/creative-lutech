/**
 * # API client cho Tieba (百度贴吧)
 */

import type { IApiClient, RequestOptions, CookieData } from "../../base/base_client.js";
// playwright imports removed
import crypto from "crypto";
import { ensureTiebaSuffix, tiebaLinkFromName, formatUnixTime, TieBaExtractor } from "./extractor.js";
import type { TiebaNote, TiebaComment, TiebaCreator } from "../../model/tieba.js";
import { TiebaSearchSortType, TiebaSearchNoteType } from "./field.js";

const PC_SIGN_SECRET = "36770b1f34c9bbf2e7d1a99d2b82fa9e";

export class TiebaClient implements IApiClient {
  private cookies: CookieData[] = [];
  private headers: Record<string, string> = {};
  private _pcTbs: string = "";
  private _host: string = "https://tieba.baidu.com";

  constructor(options?: { proxy?: string; headers?: Record<string, string> }) {
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://tieba.baidu.com/",
      "Origin": "https://tieba.baidu.com",
      ...options?.headers,
    };
  }

  // setPage method removed

  private _buildCookieHeader(): string {
    if (this.headers.Cookie) {
      return this.headers.Cookie;
    }
    return this.cookies
      .filter(cookie => cookie.name && cookie.value)
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join("; ");
  }

  private _cleanParams(params?: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(params || {})) {
      if (value === undefined || value === null) {
        continue;
      }
      result[key] = String(value);
    }
    return result;
  }

  _signPcParams(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    let signText = "";
    for (const key of sortedKeys) {
      if (key === "sign" || key === "sig" || params[key] === undefined || params[key] === null) {
        continue;
      }
      signText += `${key}=${params[key]}`;
    }
    signText += PC_SIGN_SECRET;
    return crypto.createHash("md5").update(signText, "utf8").digest("hex");
  }

  async _ensureTiebaOrigin(): Promise<void> {
    return;
  }

  async _fetchJsonByBrowser(
    uri: string,
    method: string = "GET",
    params?: Record<string, any>,
    data?: Record<string, any>,
    useSign: boolean = false
  ): Promise<any> {
    await this._ensureTiebaOrigin();

    const requestMethod = method.toUpperCase();
    const queryParams = this._cleanParams(params);
    const bodyParams = this._cleanParams(data);
    const signTarget = requestMethod === "GET" ? queryParams : bodyParams;

    if (useSign) {
      if (!signTarget.subapp_type) signTarget.subapp_type = "pc";
      if (!signTarget._client_type) signTarget._client_type = "20";
      signTarget.sign = this._signPcParams(signTarget);
    }

    const url = new URL(uri.startsWith("http") ? uri : `${this._host}${uri}`);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }

    const cookieHeader = this._buildCookieHeader();
    const headers: Record<string, string> = {
      ...this.headers,
      "Accept": "application/json, text/plain, */*",
      "X-Requested-With": "XMLHttpRequest",
    };
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const resp = await fetch(url.toString(), {
      method: requestMethod,
      headers: requestMethod === "POST"
        ? { ...headers, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }
        : headers,
      body: requestMethod === "POST" ? new URLSearchParams(bodyParams) : undefined,
    });

    const text = await resp.text();
    let jsonData: any;
    try {
      jsonData = JSON.parse(text);
    } catch {
      throw new Error(`Tieba API returned non-JSON response: status=${resp.status}, body=${text.slice(0, 300)}`);
    }

    if (!resp.ok) {
      throw new Error(`Tieba API request failed: status=${resp.status}, body=${JSON.stringify(jsonData).slice(0, 300)}`);
    }

    const errorCode = jsonData?.error_code ?? jsonData?.no;
    if (errorCode !== undefined && errorCode !== null && String(errorCode) !== "0") {
      const errorMessage = jsonData?.error_msg || jsonData?.error || jsonData?.msg || "unknown Tieba API error";
      throw new Error(`Tieba API error: code=${errorCode}, message=${errorMessage}`);
    }

    return jsonData;
  }

  // Duplicate _fetchJsonByBrowser method removed

  async _getPcTbs(): Promise<string> {
    if (this._pcTbs) {
      return this._pcTbs;
    }
    const syncData = await this._fetchJsonByBrowser(
      "/c/s/pc/sync",
      "GET",
      { subapp_type: "pc", _client_type: "20" },
      undefined,
      true
    );
    this._pcTbs = syncData?.data?.anti?.tbs || "";
    if (!this._pcTbs) {
      throw new Error(`Can not get Tieba tbs from pc sync API: ${JSON.stringify(syncData)}`);
    }
    return this._pcTbs;
  }

  async _getPcPageData(noteId: string, page: number = 1): Promise<any> {
    const tbs = await this._getPcTbs();
    return await this._fetchJsonByBrowser(
      "/c/f/pb/page_pc",
      "POST",
      undefined,
      {
        pn: page,
        lz: 0,
        r: 2,
        mark_type: 0,
        back: 0,
        fr: "",
        kz: noteId,
        session_request_times: 1,
        tbs,
        subapp_type: "pc",
        _client_type: "20",
      },
      true
    );
  }

  _extractCreatorPortrait(creatorUrl: string): string {
    const urlStr = (creatorUrl || "").trim();
    if (!urlStr) return "";
    try {
      const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
      const portrait = parsed.searchParams.get("id") || parsed.searchParams.get("portrait") || parsed.searchParams.get("un") || "";
      return decodeURIComponent(portrait).split("?")[0];
    } catch {
      // Fallback regex
      const match = urlStr.match(/[?&](id|portrait|un)=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[2]).split("?")[0];
      }
      return urlStr.split("?")[0];
    }
  }

  async request(method: string, url: string, options?: RequestOptions): Promise<any> {
    let targetUrl = url;
    if (url.startsWith("/")) {
      targetUrl = `${this._host}${url}`;
    }

    const resp = await fetch(targetUrl, {
      method: method.toUpperCase(),
      headers: {
        ...this.headers,
        ...(this._buildCookieHeader() ? { Cookie: this._buildCookieHeader() } : {}),
        ...options?.headers,
      } as Record<string, string>,
      body: options?.body ? String(options.body) : undefined,
    });
    const text = await resp.text();
    if (options?.headers?.Accept?.includes("html") || !text.trim().startsWith("{")) {
      return text;
    }
    return JSON.parse(text);
  }

  async getNotesByKeyword(
    keyword: string,
    page: number = 1,
    pageSize: number = 10,
    sort: TiebaSearchSortType = TiebaSearchSortType.TIME_DESC,
    noteType: TiebaSearchNoteType = TiebaSearchNoteType.FIXED_THREAD
  ): Promise<TiebaNote[]> {
    const params = {
      rn: Math.max(pageSize, 20),
      st: sort,
      word: keyword,
      needbrand: 1,
      sug_type: 2,
      pn: page,
      come_from: "search",
      subapp_type: "pc",
      _client_type: "20",
    };

    try {
      const apiData = await this._fetchJsonByBrowser(
        "/mo/q/search/multsearch",
        "GET",
        params,
        undefined,
        true
      );
      const notes = TieBaExtractor.extractSearchNoteListFromApi(apiData).slice(0, pageSize);
      return notes;
    } catch (e) {
      console.error(`[TiebaClient.getNotesByKeyword] Search failed:`, e);
      throw e;
    }
  }

  async getNoteById(noteId: string): Promise<TiebaNote> {
    try {
      const apiData = await this._getPcPageData(noteId, 1);
      return TieBaExtractor.extractNoteDetailFromApi(apiData);
    } catch (e) {
      console.error(`[TiebaClient.getNoteById] Failed to get post details for noteId ${noteId}:`, e);
      throw e;
    }
  }

  async getNoteAllComments(
    noteDetail: TiebaNote,
    crawlInterval: number = 1.0,
    callback?: (noteId: string, comments: TiebaComment[]) => Promise<void>,
    maxCount: number = 10
  ): Promise<TiebaComment[]> {
    const result: TiebaComment[] = [];
    let currentPage = 1;
    const totalPages = noteDetail.total_replay_page || 1;

    while (totalPages >= currentPage && result.length < maxCount) {
      try {
        const apiData = await this._getPcPageData(noteDetail.note_id!, currentPage);
        let comments = TieBaExtractor.extractTiebaNoteParentCommentsFromApi(apiData, noteDetail);

        if (comments.length === 0) {
          break;
        }

        if (result.length + comments.length > maxCount) {
          comments = comments.slice(0, maxCount - result.length);
        }

        if (callback) {
          await callback(noteDetail.note_id!, comments);
        }

        result.push(...comments);

        // Fetch sub-comments if enabled/required
        await this.getCommentsAllSubComments(comments, crawlInterval, callback);

        await new Promise(resolve => setTimeout(resolve, crawlInterval * 1000));
        currentPage++;
      } catch (e) {
        console.error(`[TiebaClient.getNoteAllComments] Failed to get page ${currentPage} comments:`, e);
        break;
      }
    }
    return result;
  }

  async getCommentsAllSubComments(
    comments: TiebaComment[],
    crawlInterval: number = 1.0,
    callback?: (noteId: string, comments: TiebaComment[]) => Promise<void>
  ): Promise<TiebaComment[]> {
    return [];
  }

  async getNotesByTiebaName(tiebaName: string, pageNum: number): Promise<TiebaNote[]> {
    const pageSize = 30;
    const apiPage = Math.floor(pageNum / pageSize) + 1;
    const tbs = await this._getPcTbs();

    try {
      const apiData = await this._fetchJsonByBrowser(
        "/c/f/frs/page_pc",
        "POST",
        undefined,
        {
          kw: encodeURIComponent(tiebaName),
          pn: apiPage,
          sort_type: -1,
          is_newfrs: 1,
          is_newfeed: 1,
          rn: pageSize,
          rn_need: 10,
          tbs,
          subapp_type: "pc",
          _client_type: "20",
        },
        true
      );
      return TieBaExtractor.extractTiebaNoteListFromFrsApi(apiData).slice(0, pageSize);
    } catch (e) {
      console.error(`[TiebaClient.getNotesByTiebaName] Failed to get Tieba note list:`, e);
      throw e;
    }
  }

  async getCreatorInfoByUrl(creatorUrl: string): Promise<TiebaCreator> {
    const portrait = this._extractCreatorPortrait(creatorUrl);
    if (!portrait) {
      throw new Error(`Can not extract Tieba creator portrait from url: ${creatorUrl}`);
    }

    try {
      const apiData = await this._fetchJsonByBrowser(
        "/c/u/pc/homeSidebarRight",
        "GET",
        {
          portrait,
          un: "",
          subapp_type: "pc",
          _client_type: "20",
        },
        undefined,
        true
      );
      return TieBaExtractor.extractCreatorInfoFromApi(apiData);
    } catch (e) {
      console.error(`[TiebaClient.getCreatorInfoByUrl] Failed to get creator info:`, e);
      throw e;
    }
  }

  async getNotesByCreatorPortrait(portrait: string, pageNumber: number, pageSize: number = 20): Promise<any> {
    return await this._fetchJsonByBrowser(
      "/c/u/feed/myThread",
      "GET",
      {
        pn: pageNumber,
        rn: pageSize,
        portrait,
        type: 1,
        un: "",
        subapp_type: "pc",
        _client_type: "20",
      },
      undefined,
      true
    );
  }

  async getNotesByCreator(userName: string, pageNumber: number): Promise<any> {
    throw new Error("browser mode removed, provide valid cookie/session");
  }

  async getAllNotesByCreatorUserName(
    userName: string,
    crawlInterval: number = 1.0,
    callback?: (notes: TiebaNote[]) => Promise<void>,
    maxNoteCount: number = 0,
    creatorPageHtmlContent?: string
  ): Promise<TiebaNote[]> {
    const result: TiebaNote[] = [];

    // creatorPageHtmlContent block removed

    let notesHasMore = 1;
    let pageNumber = 1;
    const pagePerCount = 20;
    let totalGetCount = 0;

    while (notesHasMore === 1 && (maxNoteCount === 0 || totalGetCount < maxNoteCount)) {
      const notesRes = await this.getNotesByCreator(userName, pageNumber);
      if (!notesRes || notesRes.no !== 0) {
        break;
      }
      const notesData = notesRes.data || {};
      notesHasMore = notesData.has_more !== undefined ? notesData.has_more : 0;
      const threadList = notesData.thread_list || [];

      const noteDetailTasks = threadList.map((note: any) => this.getNoteById(String(note.thread_id)));
      const notes = (await Promise.all(noteDetailTasks)).filter(Boolean);
      if (callback && notes.length > 0) {
        await callback(notes);
      }
      
      result.push(...notes);
      await new Promise(resolve => setTimeout(resolve, crawlInterval * 1000));
      pageNumber++;
      totalGetCount += pagePerCount;
    }
    return result;
  }

  async getAllNotesByCreatorUrl(
    creatorUrl: string,
    crawlInterval: number = 1.0,
    callback?: (notes: TiebaNote[]) => Promise<void>,
    maxNoteCount: number = 0
  ): Promise<TiebaNote[]> {
    const portrait = this._extractCreatorPortrait(creatorUrl);
    if (!portrait) {
      throw new Error(`Can not extract Tieba creator portrait from url: ${creatorUrl}`);
    }

    const result: TiebaNote[] = [];
    let pageNumber = 1;
    const pageSize = 20;

    while (maxNoteCount === 0 || result.length < maxNoteCount) {
      const notesRes = await this.getNotesByCreatorPortrait(portrait, pageNumber, pageSize);
      let threadIdList = TieBaExtractor.extractCreatorThreadIdListFromApi(notesRes);
      if (threadIdList.length === 0) {
        break;
      }

      if (maxNoteCount > 0 && result.length + threadIdList.length > maxNoteCount) {
        threadIdList = threadIdList.slice(0, maxNoteCount - result.length);
      }

      const noteDetailTasks = threadIdList.map(id => this.getNoteById(id));
      const notes = (await Promise.all(noteDetailTasks)).filter(Boolean);
      if (callback && notes.length > 0) {
        await callback(notes);
      }
      result.push(...notes);

      const data = notesRes.data || {};
      const hasMore = Number(data.has_more || 0);
      if (!hasMore) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, crawlInterval * 1000));
      pageNumber++;
    }

    return result;
  }

  async pong(): Promise<boolean> {
    try {
      await this._getPcTbs();
      return true;
    } catch {
      return false;
    }
  }

  async updateCookies(cookies: CookieData[]): Promise<void> {
    this.cookies = cookies;
    const cookieHeader = this.cookies
      .filter(cookie => cookie.name && cookie.value)
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join("; ");
    if (cookieHeader) {
      this.headers.Cookie = cookieHeader;
    } else {
      delete this.headers.Cookie;
    }
  }

  getActiveCookies(): CookieData[] {
    return this.cookies;
  }
}
