/**
 * # Parser và extractor helper cho Baidu Tieba (百度贴吧)
 */

import type { TiebaNote, TiebaComment, TiebaCreator } from "../../model/tieba.js";
// playwright Page type removed

export function ensureTiebaSuffix(tiebaName: string): string {
  const name = (tiebaName || "").trim();
  if (!name) return "";
  return name.endsWith("吧") ? name : `${name}吧`;
}

export function tiebaLinkFromName(tiebaName: string): string {
  if (!tiebaName) return "https://tieba.baidu.com";
  const name = tiebaName.endsWith("吧") ? tiebaName.slice(0, -1) : tiebaName;
  return `https://tieba.baidu.com/f?kw=${encodeURIComponent(name)}`;
}

export function extractApiContentText(content: any): string {
  if (typeof content === "string") {
    return content.replace(/\s+/g, " ").trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }
  const textList: string[] = [];
  for (const item of content) {
    if (item && typeof item === "object") {
      const text = item.text || item.c || "";
      if (text) {
        textList.push(String(text));
      }
    }
  }
  return textList.join("").replace(/\s+/g, " ").trim();
}

export function apiUserMap(apiData: any): Record<string, any> {
  const map: Record<string, any> = {};
  const userList = apiData?.user_list || [];
  for (const user of userList) {
    if (user && user.id) {
      map[String(user.id)] = user;
    }
  }
  return map;
}

export function apiUserLink(user: any): string {
  const portrait = user?.portrait || "";
  if (!portrait) return "";
  return `https://tieba.baidu.com/home/main?id=${encodeURIComponent(portrait)}`;
}

export function apiUserAvatar(user: any): string {
  const imgUrl = user?.user_show_info?.feed_head?.image_data?.img_url;
  if (imgUrl) return imgUrl;
  const portrait = user?.portrait || "";
  if (portrait) {
    return `https://gss0.bdstatic.com/6LZ1dD3d1sgCo2Kml5_Y_D3/sys/portrait/item/${portrait}`;
  }
  return "";
}

export function formatUnixTime(unixTime: number): string {
  if (!unixTime) return new Date().toISOString();
  return new Date(unixTime * 1000).toISOString();
}

function addUniqueUrl(urls: string[], url: unknown): void {
  if (typeof url !== "string" || !url.trim()) {
    return;
  }
  const cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl) || urls.includes(cleanUrl)) {
    return;
  }
  urls.push(cleanUrl);
}

function extractMediaUrlsFromContent(content: any): string[] {
  const urls: string[] = [];
  const items = Array.isArray(content) ? content : [];
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    addUniqueUrl(urls, item.origin_src);
    addUniqueUrl(urls, item.big_cdn_src);
    addUniqueUrl(urls, item.cdn_src);
    addUniqueUrl(urls, item.cdn_src_active);
  }
  return urls;
}

function extractThreadMediaUrls(apiData: any): string[] {
  const urls: string[] = [];
  const mediaList = apiData?.thread?.origin_thread_info?.media || [];
  for (const media of Array.isArray(mediaList) ? mediaList : []) {
    addUniqueUrl(urls, media.big_pic);
    addUniqueUrl(urls, media.water_pic);
    addUniqueUrl(urls, media.small_pic);
  }

  addUniqueUrl(urls, apiData?.thread?.t_share_img);

  const firstFloorUrls = extractMediaUrlsFromContent(apiData?.first_floor?.content);
  for (const url of firstFloorUrls) {
    addUniqueUrl(urls, url);
  }

  const postList = Array.isArray(apiData?.post_list) ? apiData.post_list : [];
  for (const post of postList) {
    const postUrls = extractMediaUrlsFromContent(post?.content);
    for (const url of postUrls) {
      addUniqueUrl(urls, url);
    }
  }

  return urls;
}

export class TieBaExtractor {
  static cleanTitle(title: string, tiebaName: string = ""): string {
    let t = (title || "").replace(/\s+/g, " ").trim();
    t = t.replace(/_(?:百度贴吧|Baidu Tieba)$/i, "").trim();
    const names = new Set([tiebaName, tiebaName.replace(/吧$/, "")]);
    for (const name of names) {
      if (name) {
        t = t.replace(new RegExp(`【${name}】`, "g"), "").trim();
      }
    }
    return t;
  }

  static extractSearchNoteListFromApi(apiData: any): TiebaNote[] {
    const result: TiebaNote[] = [];
    const cards = apiData?.data?.card_list || [];
    for (const card of cards) {
      if (card.cardInfo !== "thread" && card.cardStyle !== "thread") {
        continue;
      }
      const item = card.data || {};
      const noteId = String(item.tid || "");
      if (!noteId) continue;
      const user = item.user || {};
      const tiebaName = ensureTiebaSuffix(item.forum_name || "");
      result.push({
        note_id: noteId,
        title: this.cleanTitle(item.title || "", tiebaName),
        desc: (item.content || "").replace(/\s+/g, " ").trim(),
        note_url: `https://tieba.baidu.com/p/${noteId}`,
        publish_time: formatUnixTime(item.time || item.create_time || 0),
        user_link: "",
        user_nickname: user.show_nickname || user.user_name || "",
        user_avatar: user.portrait || user.portraith || "",
        tieba_name: tiebaName,
        tieba_link: tiebaLinkFromName(tiebaName),
        total_replay_num: Number(item.post_num || 0),
      });
    }
    return result;
  }

  static extractNoteDetailFromApi(apiData: any): TiebaNote {
    const thread = apiData?.thread || {};
    const firstFloor = apiData?.first_floor || {};
    const forum = apiData?.forum || apiData?.display_forum || {};
    const page = apiData?.page || {};
    const uMap = apiUserMap(apiData);
    const author = uMap[String(firstFloor.author_id)] || {};
    const noteId = String(thread.id || thread.tid || firstFloor.tid || "");
    const tiebaName = ensureTiebaSuffix(forum.name || "");
    const mediaUrls = extractThreadMediaUrls(apiData);
    const coverUrl = mediaUrls[0] || "";
    return {
      note_id: noteId,
      title: this.cleanTitle(thread.title || firstFloor.title || "", tiebaName),
      desc: extractApiContentText(
        firstFloor.content ||
        thread.origin_thread_info?.abstract ||
        thread.origin_thread_info?.content
      ),
      note_url: `https://tieba.baidu.com/p/${noteId}`,
      publish_time: formatUnixTime(firstFloor.time || thread.create_time || 0),
      user_link: apiUserLink(author),
      user_nickname: author.name_show || author.name || "",
      user_avatar: apiUserAvatar(author),
      tieba_name: tiebaName,
      tieba_link: tiebaLinkFromName(tiebaName),
      total_replay_num: Number(thread.reply_num || 0),
      total_replay_page: Number(page.total_page || 0),
      ip_location: author.ip_address || "",
      media_urls: mediaUrls,
      cover_url: coverUrl,
      original_media_urls: mediaUrls,
      original_cover_url: coverUrl,
      media_type: mediaUrls.length > 1 ? "carousel" : (mediaUrls.length === 1 ? "image" : "unknown"),
    };
  }

  static extractTiebaNoteParentCommentsFromApi(apiData: any, noteDetail: TiebaNote): TiebaComment[] {
    const forum = apiData?.forum || apiData?.display_forum || {};
    const tiebaId = String(forum.id || "");
    const tiebaName = noteDetail.tieba_name || ensureTiebaSuffix(forum.name || "");
    const tiebaLink = noteDetail.tieba_link || tiebaLinkFromName(tiebaName);
    const uMap = apiUserMap(apiData);
    const result: TiebaComment[] = [];

    const postList = apiData?.post_list || [];
    for (const item of postList) {
      const commentId = String(item.id || "");
      if (!commentId) continue;
      const user = uMap[String(item.author_id)] || {};
      result.push({
        comment_id: commentId,
        sub_comment_count: Number(item.sub_post_number || 0),
        content: extractApiContentText(item.content),
        note_url: noteDetail.note_url,
        user_link: apiUserLink(user),
        user_nickname: user.name_show || user.name || "",
        user_avatar: apiUserAvatar(user),
        tieba_id: tiebaId,
        tieba_name: tiebaName,
        tieba_link: tiebaLink,
        ip_location: user.ip_address || "",
        publish_time: formatUnixTime(item.time || 0),
        note_id: noteDetail.note_id,
      });
    }
    return result;
  }

  static extractCreatorInfoFromApi(apiData: any): TiebaCreator {
    const user = apiData?.data?.user || {};
    if (!user || !user.id) {
      throw new Error(`Creator API response does not contain user info: ${JSON.stringify(apiData)}`);
    }
    const genderValue = user.sex !== undefined ? user.sex : (user.gender || 0);
    let gender = "Unknown";
    if (genderValue === 1) {
      gender = "Male";
    } else if (genderValue === 2) {
      gender = "Female";
    }

    return {
      user_id: String(user.id || ""),
      user_name: String(user.name || ""),
      nickname: String(user.name_show || user.name || ""),
      avatar: apiUserAvatar(user),
      gender,
      ip_location: String(user.ip_address || ""),
      follows: String(user.concern_num || 0),
      fans: String(user.fans_num || 0),
      registration_duration: String(user.tb_age || ""),
    };
  }

  static extractCreatorThreadIdListFromApi(apiData: any): string[] {
    const threadIds: string[] = [];
    const list = apiData?.data?.list || [];
    for (const item of list) {
      const threadInfo = item.thread_info || {};
      const threadId = threadInfo.tid || threadInfo.id;
      if (threadId) {
        threadIds.push(String(threadId));
      }
    }
    return threadIds;
  }

  static extractTiebaNoteListFromFrsApi(apiData: any): TiebaNote[] {
    const forum = apiData?.forum || {};
    const tiebaName = ensureTiebaSuffix(forum.name || "");
    const tiebaLink = tiebaLinkFromName(tiebaName);
    const tidsStr = String(forum.tids || "");
    const tids = tidsStr.split(",").map(t => t.trim()).filter(Boolean);

    return tids.map(tid => ({
      note_id: tid,
      title: "",
      desc: "",
      note_url: `https://tieba.baidu.com/p/${tid}`,
      tieba_name: tiebaName,
      tieba_link: tiebaLink,
    }));
  }

  // Browser evaluation helpers to query directly from DOM
  static async extractTiebaNoteSubCommentsFromPage(page: any, parentComment: TiebaComment): Promise<TiebaComment[]> {
    return await page.evaluate((parent: any) => {
      const result: any[] = [];
      const commentElements = document.querySelectorAll("li.lzl_single_post, li.j_lzl_s_p");
      for (const el of commentElements) {
        let commentValue: any = {};
        try {
          const df = el.getAttribute("data-field");
          if (df) {
            commentValue = JSON.parse(df.replace(/&quot;/g, '"'));
          }
        } catch (e) {}

        const userLinkEl = el.querySelector("a.j_user_card.lzl_p_p");
        const userLink = userLinkEl ? (userLinkEl as HTMLAnchorElement).href : "";
        const userAvatar = userLinkEl?.querySelector("img")?.src || "";

        const contentEl = el.querySelector("span.lzl_content_main");
        const content = contentEl ? contentEl.textContent || "" : "";

        const timeEl = el.querySelector("span.lzl_time");
        const publishTime = timeEl ? timeEl.textContent || "" : "";

        result.push({
          comment_id: String(commentValue.spid || ""),
          content: content.trim(),
          user_link: userLink,
          user_nickname: String(commentValue.showname || ""),
          user_avatar: userAvatar,
          publish_time: publishTime.trim(),
          parent_comment_id: parent.comment_id,
          note_id: parent.note_id,
          note_url: parent.note_url,
          tieba_id: parent.tieba_id,
          tieba_name: parent.tieba_name,
          tieba_link: parent.tieba_link,
        });
      }
      return result;
    }, parentComment);
  }

  static async extractCreatorThreadIdListFromPage(page: any): Promise<string[]> {
    return await page.evaluate(() => {
      const threadIds: string[] = [];
      const links = document.querySelectorAll("ul.new_list.clearfix div.thread_name a[href*='/p/']");
      for (const link of links) {
        const href = (link as HTMLAnchorElement).href || "";
        const parts = href.split("?")[0].split("/");
        const id = parts[parts.length - 1];
        if (id) {
          threadIds.push(id);
        }
      }
      return threadIds;
    });
  }
}
