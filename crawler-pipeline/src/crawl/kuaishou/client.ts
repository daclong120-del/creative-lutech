/**
 * # API client cho Kuaishou — gọi GraphQL API và REST API v2
 */

import type { IApiClient, RequestOptions, CookieData } from "../../base/base_client.js";
// playwright imports removed
import { CONFIG } from "../../config.js";
import { ProxyAgent } from "undici";
import { GRAPHQL_QUERIES } from "./graphql.js";

type KuaishouCookieInput = CookieData[] | Record<string, string> | string;

let dispatcher: ProxyAgent | undefined;
if (CONFIG.proxy) {
  dispatcher = new ProxyAgent(CONFIG.proxy);
}

export class KuaishouClient implements IApiClient {
  private cookies: CookieData[] = [];
  private headers: Record<string, string> = {};
  private _host: string = "https://www.kuaishou.com";
  private _graphqlHost: string = "https://www.kuaishou.com/graphql";

  constructor(options?: { proxy?: string; headers?: Record<string, string> }) {
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Referer": "https://www.kuaishou.com/",
      "Origin": "https://www.kuaishou.com",
      "Content-Type": "application/json;charset=UTF-8",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      ...options?.headers,
    };
  }

  // setPage method removed

  private _normalizeCookies(cookies: KuaishouCookieInput): string {
    if (!cookies) {
      return "";
    }
    if (typeof cookies === "string") {
      return cookies.trim();
    }
    if (Array.isArray(cookies)) {
      return cookies
        .filter(cookie => cookie.name && cookie.value)
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join("; ");
    }
    return Object.entries(cookies)
      .filter(([name, value]) => name && value !== undefined && value !== null)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  private _buildCookieHeader(): string {
    if (this.headers.Cookie) {
      return this.headers.Cookie;
    }
    return this._normalizeCookies(this.cookies);
  }

  /**
   * # Kiểm tra trạng thái đăng nhập Kuaishou qua visionProfileUserList
   */
  async pong(): Promise<boolean> {
    try {
      const postData = {
        operationName: "visionProfileUserList",
        variables: {
          ftype: 1,
        },
        query: GRAPHQL_QUERIES.vision_profile_user_list,
      };

      const res = await this.post("/graphql", postData);
      return res?.visionProfileUserList?.result === 1;
    } catch (e) {
      console.warn("[KuaishouClient.pong] Gặp lỗi kiểm tra ping:", (e as Error).message);
      return false;
    }
  }

  /**
   * # Gửi POST request dạng JSON tiện ích
   */
  async post(uri: string, data: any): Promise<any> {
    return this.request("POST", uri, {
      body: data,
    });
  }

  /**
   * # Thực hiện gửi yêu cầu HTTP (ưu tiên chạy qua page.evaluate để tận dụng session và tránh chữ ký)
   */
  async request(method: string, url: string, options?: RequestOptions): Promise<any> {
    let finalUrl = url;
    if (!url.startsWith("http")) {
      if (url.startsWith("/graphql") || url === "") {
        finalUrl = this._graphqlHost;
      } else {
        finalUrl = `${this._host}${url}`;
      }
    }

    const cookieStr = this._buildCookieHeader();
    const requestHeaders = {
      ...this.headers,
      ...options?.headers,
      ...(cookieStr ? { "Cookie": cookieStr } : {}),
    };

    let responseText = "";

    // Browser evaluate block removed

    // 2. Fallback sang gọi HTTP thuần qua Node (undici/fetch)
    if (!responseText) {
      try {
        let lastError: Error | undefined;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const fetchOpts: any = {
              method,
              headers: requestHeaders,
              signal: AbortSignal.timeout(30000),
            };
            if (options?.body) {
              fetchOpts.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
            }
            if (dispatcher) {
              fetchOpts.dispatcher = dispatcher;
            }

            const response = await fetch(finalUrl, fetchOpts);
            responseText = await response.text();

            if (response.status !== 200) {
              throw new Error(`HTTP Status ${response.status}: ${responseText.slice(0, 200)}`);
            }
            break;
          } catch (err) {
            lastError = err as Error;
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
        }

        if (!responseText && lastError) {
          throw lastError;
        }
      } catch (err) {
        throw new Error(`Yêu cầu HTTP thất bại: ${(err as Error).message}`);
      }
    }

    if (!responseText.trim().startsWith("{")) {
      return responseText;
    }

    try {
      const data = JSON.parse(responseText);
      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }
      return data.data || data;
    } catch (err) {
      throw new Error(`Lỗi phân tích JSON phản hồi: ${(err as Error).message}. Phản hồi: ${responseText.substring(0, 200)}`);
    }
  }

  /**
   * # Cập nhật danh sách Cookie
   */
  async updateCookies(cookies: KuaishouCookieInput): Promise<void> {
    this.cookies = Array.isArray(cookies) ? cookies : [];
    const cookieStr = this._normalizeCookies(cookies);
    if (cookieStr) {
      this.headers.Cookie = cookieStr;
    } else {
      delete this.headers.Cookie;
    }
  }

  /**
   * # Lấy danh sách Cookie đang hoạt động
   */
  getActiveCookies(): CookieData[] {
    return this.cookies;
  }

  /**
   * # Tìm kiếm bài viết theo từ khóa
   */
  async searchInfoByKeyword(keyword: string, pcursor: string, searchSessionId: string = ""): Promise<any> {
    const postData = {
      operationName: "visionSearchPhoto",
      variables: {
        keyword,
        pcursor,
        page: "search",
        searchSessionId,
        webPageArea: "search",
      },
      query: GRAPHQL_QUERIES.search_query,
    };
    return this.post("/graphql", postData);
  }

  /**
   * # Lấy thông tin chi tiết video
   */
  async getVideoInfo(photoId: string): Promise<any> {
    const postData = {
      operationName: "visionVideoDetail",
      variables: {
        photoId,
        page: "search"
      },
      query: GRAPHQL_QUERIES.video_detail,
    };
    return this.post("/graphql", postData);
  }

  /**
   * # Lấy danh sách bình luận (REST API V2)
   */
  async getVideoComments(photoId: string, pcursor: string = ""): Promise<any> {
    const postData = {
      photoId,
      pcursor,
    };
    const result = await this.request("POST", "/rest/v/photo/comment/list", {
      body: postData,
    });
    if (result?.result !== 1) {
      throw new Error(`REST API V2 error: ${JSON.stringify(result)}`);
    }
    return result;
  }

  /**
   * # Lấy danh sách bình luận con (REST API V2)
   */
  async getVideoSubComments(photoId: string, rootCommentId: string, pcursor: string = ""): Promise<any> {
    // Ép kiểu rootCommentId sang số nguyên nếu có thể vì API Kuaishou yêu cầu kiểu int
    const rootCommentIdInt = isNaN(Number(rootCommentId)) ? rootCommentId : Number(rootCommentId);
    const postData = {
      photoId,
      pcursor,
      rootCommentId: rootCommentIdInt,
    };
    const result = await this.request("POST", "/rest/v/photo/comment/sublist", {
      body: postData,
    });
    if (result?.result !== 1) {
      throw new Error(`REST API V2 sub-comment error: ${JSON.stringify(result)}`);
    }
    return result;
  }

  /**
   * # Lấy profile creator
   */
  async getCreatorProfile(userId: string): Promise<any> {
    const postData = {
      operationName: "visionProfile",
      variables: {
        userId
      },
      query: GRAPHQL_QUERIES.vision_profile,
    };
    return this.post("/graphql", postData);
  }

  /**
   * # Lấy danh sách video của creator
   */
  async getVideoByCreator(userId: string, pcursor: string = ""): Promise<any> {
    const postData = {
      operationName: "visionProfilePhotoList",
      variables: {
        page: "profile",
        pcursor,
        userId
      },
      query: GRAPHQL_QUERIES.vision_profile_photo_list,
    };
    return this.post("/graphql", postData);
  }

  /**
   * # Lấy chi tiết thông tin creator
   */
  async getCreatorInfo(userId: string): Promise<any> {
    const visionProfile = await this.getCreatorProfile(userId);
    return visionProfile?.userProfile;
  }

  /**
   * # Cào toàn bộ bình luận của video (cả root và sub comments)
   */
  async getVideoAllComments(
    photoId: string,
    crawlInterval: number = 1.0,
    callback?: (photoId: string, comments: any[]) => Promise<void>,
    maxCount: number = 10
  ): Promise<any[]> {
    const result: any[] = [];
    let pcursor = "";

    while (pcursor !== "no_more" && result.length < maxCount) {
      try {
        const commentsRes = await this.getVideoComments(photoId, pcursor);
        pcursor = commentsRes.pcursorV2 || "no_more";
        let comments = commentsRes.rootCommentsV2 || [];

        if (result.length + comments.length > maxCount) {
          comments = comments.slice(0, maxCount - result.length);
        }

        if (callback && comments.length > 0) {
          await callback(photoId, comments);
        }
        result.push(...comments);

        await new Promise(r => setTimeout(r, crawlInterval * 1000));

        if (process.env.ENABLE_GET_SUB_COMMENTS !== "false" && process.env.CRAWLER_ENABLE_SUB_COMMENTS !== "false") {
          const subComments = await this.getCommentsAllSubComments(
            comments,
            photoId,
            crawlInterval,
            callback
          );
          result.push(...subComments);
        }
      } catch (err) {
        console.error(`[KuaishouClient.getVideoAllComments] Lỗi cào comment cho photo ${photoId}:`, err);
        break;
      }
    }
    return result;
  }

  /**
   * # Cào toàn bộ bình luận con cho danh sách bình luận cha
   */
  async getCommentsAllSubComments(
    comments: any[],
    photoId: string,
    crawlInterval: number = 1.0,
    callback?: (photoId: string, comments: any[]) => Promise<void>
  ): Promise<any[]> {
    const result: any[] = [];
    for (const comment of comments) {
      const hasSubComments = comment.hasSubComments || comment.subCommentCount > 0;
      if (!hasSubComments) {
        continue;
      }

      const rootCommentId = comment.comment_id || comment.commentId;
      if (!rootCommentId) {
        continue;
      }

      let subCommentPcursor = "";
      while (subCommentPcursor !== "no_more") {
        try {
          const subRes = await this.getVideoSubComments(photoId, String(rootCommentId), subCommentPcursor);
          subCommentPcursor = subRes.pcursorV2 || "no_more";
          const subComments = subRes.subCommentsV2 || [];

          if (callback && subComments.length > 0) {
            await callback(photoId, subComments);
          }
          result.push(...subComments);

          await new Promise(r => setTimeout(r, crawlInterval * 1000));
        } catch (err) {
          console.error(`[KuaishouClient.getCommentsAllSubComments] Lỗi cào sub comments cho comment ${rootCommentId}:`, err);
          break;
        }
      }
    }
    return result;
  }

  /**
   * # Cào toàn bộ danh sách video của creator
   */
  async getAllVideosByCreator(
    userId: string,
    crawlInterval: number = 1.0,
    callback?: (videos: any[]) => Promise<void>,
    maxCount: number = 0
  ): Promise<any[]> {
    const result: any[] = [];
    let pcursor = "";

    while (pcursor !== "no_more" && (maxCount === 0 || result.length < maxCount)) {
      try {
        const videosRes = await this.getVideoByCreator(userId, pcursor);
        if (!videosRes) {
          console.error(`[KuaishouClient.getAllVideosByCreator] Trống hoặc lỗi phản hồi cho creator: ${userId}`);
          break;
        }

        const listObj = videosRes.visionProfilePhotoList || {};
        pcursor = listObj.pcursor || "no_more";
        let feeds = listObj.feeds || [];
        if (maxCount > 0 && result.length + feeds.length > maxCount) {
          feeds = feeds.slice(0, maxCount - result.length);
        }

        console.log(`[KuaishouClient.getAllVideosByCreator] Đã cào được ${feeds.length} video từ creator ${userId}`);

        if (callback && feeds.length > 0) {
          await callback(feeds);
        }
        result.push(...feeds);

        await new Promise(r => setTimeout(r, crawlInterval * 1000));
      } catch (err) {
        console.error(`[KuaishouClient.getAllVideosByCreator] Lỗi cào video của creator ${userId}:`, err);
        break;
      }
    }
    return result;
  }
}
