/**
 * # API client cho Weibo
 */

import type { IApiClient, RequestOptions, CookieData } from "../../base/base_client.js";
// playwright imports removed
import { CONFIG } from "../../config.js";
import { ProxyAgent } from "undici";
import { WeiboSearchType } from "./field.js";

let dispatcher: ProxyAgent | undefined;
if (CONFIG.proxy) {
  dispatcher = new ProxyAgent(CONFIG.proxy);
}

export class WeiboClient implements IApiClient {
  private cookies: CookieData[] = [];
  private headers: Record<string, string> = {};
  private _host: string = "https://m.weibo.cn";
  private cookieUrls: string[] = ["https://m.weibo.cn"];

  constructor(options?: { proxy?: string; headers?: Record<string, string> }) {
    this.headers = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1",
      "Referer": "https://m.weibo.cn/",
      "Origin": "https://m.weibo.cn",
      "Accept": "application/json, text/plain, */*",
      "MWeibo-Pwa": "1",
      "X-Requested-With": "XMLHttpRequest",
      ...options?.headers,
    };
  }

  // setPage method removed

  /**
   * # Kiểm tra kết nối và trạng thái đăng nhập Weibo
   */
  async pong(): Promise<boolean> {
    try {
      const data = await this.request("GET", "/api/config");
      return data?.login === true;
    } catch {
      return false;
    }
  }

  /**
   * # Thực hiện gửi yêu cầu HTTP (ưu tiên chạy qua page.evaluate để tận dụng session và tránh bị chặn)
   */
  async request(method: string, url: string, options?: RequestOptions): Promise<any> {
    const finalUrl = url.startsWith("http") ? url : `${this._host}${url}`;

    // Nạp Cookie hiện tại từ state vào header nếu dùng node fetch
    const cookieStr = this.cookies.map(c => `${c.name}=${c.value}`).join("; ");
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
        responseText = await response.text();

        if (response.status !== 200) {
          throw new Error(`HTTP Status ${response.status}`);
        }
      } catch (err) {
        throw new Error(`Yêu cầu HTTP thất bại: ${(err as Error).message}`);
      }
    }

    // Kiểm tra định dạng phản hồi
    if (options?.headers?.["Accept"]?.includes("text/html") || !responseText.trim().startsWith("{")) {
      return responseText;
    }

    try {
      const data = JSON.parse(responseText);
      // Mẫu API Weibo: { ok: 1, data: ... }
      if (data.ok === 0) {
        throw new Error(data.msg || "API báo lỗi ok=0");
      }
      return data.data || data;
    } catch (err) {
      throw new Error(`Lỗi phân tích JSON phản hồi: ${(err as Error).message}. Phản hồi: ${responseText.substring(0, 200)}`);
    }
  }

  /**
   * # Cập nhật danh sách Cookie
   */
  async updateCookies(cookies: CookieData[]): Promise<void> {
    this.cookies = cookies;
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    this.headers["Cookie"] = cookieStr;
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
  async getNoteByKeyword(keyword: string, page: number = 1, searchType: WeiboSearchType = WeiboSearchType.DEFAULT): Promise<any> {
    const containerid = `100103type=${searchType}&q=${encodeURIComponent(keyword)}`;
    const url = `/api/container/getIndex?containerid=${containerid}&page_type=searchall&page=${page}`;
    return this.request("GET", url);
  }

  /**
   * # Lấy bình luận của bài viết
   */
  async getNoteComments(midId: string, maxId: string | number = 0, maxIdType: number = 0): Promise<any> {
    let url = `/comments/hotflow?id=${midId}&mid=${midId}&max_id_type=${maxIdType}`;
    if (Number(maxId) > 0) {
      url += `&max_id=${maxId}`;
    }
    return this.request("GET", url, {
      headers: {
        "Referer": `${this._host}/detail/${midId}`
      }
    });
  }

  /**
   * # Lấy tất cả bình luận và bình luận con của một bài đăng
   */
  async getNoteAllComments(
    noteId: string,
    crawlInterval: number = 1.0,
    callback?: (noteId: string, comments: any[]) => Promise<void>,
    maxCount: number = 10
  ): Promise<any[]> {
    const result: any[] = [];
    let isEnd = false;
    let maxId: string | number = 0;
    let maxIdType = 0;

    while (!isEnd && result.length < maxCount) {
      try {
        const res = await this.getNoteComments(noteId, maxId, maxIdType);
        maxId = res.max_id || 0;
        maxIdType = res.max_id_type || 0;
        const commentList: any[] = res.data || [];

        isEnd = !maxId || Number(maxId) === 0;

        let currentBatch = commentList;
        if (result.length + currentBatch.length > maxCount) {
          currentBatch = currentBatch.slice(0, maxCount - result.length);
        }

        if (callback && currentBatch.length > 0) {
          await callback(noteId, currentBatch);
        }

        result.push(...currentBatch);

        // Trích xuất sub-comments trực tiếp từ comment list nếu có
        for (const comment of currentBatch) {
          const subComments = comment.comments;
          if (subComments && Array.isArray(subComments) && subComments.length > 0) {
            if (callback) {
              await callback(noteId, subComments);
            }
            result.push(...subComments);
          }
        }

        if (!isEnd) {
          await new Promise(r => setTimeout(r, crawlInterval * 1000));
        }
      } catch (err) {
        console.error(`[WeiboClient.getNoteAllComments] Lỗi cào comment cho ${noteId}:`, (err as Error).message);
        break;
      }
    }

    return result;
  }

  /**
   * # Lấy chi tiết bài viết qua noteId (HTML Scrape)
   */
  async getNoteInfoById(noteId: string): Promise<any> {
    const html = await this.request("GET", `/detail/${noteId}`, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const match = html.match(/var \$render_data = (\[[\s\S]*?\])\[0\]/);
    if (match) {
      try {
        const renderData = JSON.parse(match[1]);
        const status = renderData[0]?.status;
        return { mblog: status };
      } catch (err) {
        console.error("[WeiboClient.getNoteInfoById] JSON parse render data error:", err);
      }
    }
    return {};
  }

  /**
   * # Lấy thông tin container ID của creator
   */
  async getCreatorContainerInfo(creatorId: string): Promise<{ fid_container_id: string; lfid_container_id: string }> {
    return {
      fid_container_id: `100505${creatorId}`,
      lfid_container_id: `107603${creatorId}`,
    };
  }

  /**
   * # Lấy thông tin creator qua ID
   */
  async getCreatorInfoById(creatorId: string): Promise<any> {
    const containerid = `100505${creatorId}`;
    const url = `/api/container/getIndex?jumpfrom=weibocom&type=uid&value=${creatorId}&containerid=${containerid}`;
    return this.request("GET", url);
  }

  /**
   * # Lấy danh sách bài viết của Creator (theo containerId và phân trang sinceId)
   */
  async getNotesByCreator(creatorId: string, containerId: string, sinceId?: string): Promise<any> {
    let url = `/api/container/getIndex?jumpfrom=weibocom&type=uid&value=${creatorId}&containerid=${containerId}`;
    if (sinceId) {
      url += `&since_id=${sinceId}`;
    }
    return this.request("GET", url);
  }

  /**
   * # Cào toàn bộ bài viết của Creator
   */
  async getAllNotesByCreatorId(
    creatorId: string,
    containerId: string,
    crawlInterval: number = 1.0,
    callback?: (notes: any[]) => Promise<void>
  ): Promise<any[]> {
    const result: any[] = [];
    let hasMore = true;
    let sinceId = "";
    let pageCount = 0;

    while (hasMore) {
      try {
        const res = await this.getNotesByCreator(creatorId, containerId, sinceId);
        if (!res) {
          break;
        }

        sinceId = res.cardlistInfo?.since_id || "";
        const cards: any[] = res.cards || [];

        // Chỉ lọc các card bài đăng (card_type === 9)
        const notes = cards.filter(card => card.card_type === 9);

        if (notes.length > 0) {
          if (callback) {
            await callback(notes);
          }
          result.push(...notes);
        }

        pageCount += 10;
        const total = res.cardlistInfo?.total || 0;
        hasMore = total > pageCount && !!sinceId;

        if (hasMore) {
          await new Promise(r => setTimeout(r, crawlInterval * 1000));
        }
      } catch (err) {
        console.error(`[WeiboClient.getAllNotesByCreatorId] Lỗi cào creator ${creatorId}:`, (err as Error).message);
        break;
      }
    }

    return result;
  }
}
