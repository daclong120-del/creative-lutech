import { douyinGet } from "./http_client.js";
import { DouyinSession } from "./session.js";

/**
 * # Lấy thông tin profile cá nhân của session hiện tại (Heartbeat)
 */
export async function getSelfProfile(session: DouyinSession): Promise<any> {
  return douyinGet("/aweme/v1/web/user/profile/self/", {}, session, { sign: true });
}

/**
 * # Tìm kiếm bài đăng theo từ khóa
 */
export async function searchAweme(
  session: DouyinSession,
  keyword: string,
  offset: number = 0,
  searchId: string = ""
): Promise<any> {
  const referer = encodeURI(`https://www.douyin.com/search/${keyword}?aid=6383&type=general`);
  return douyinGet(
    "/aweme/v1/web/general/search/stream/",
    {
      search_channel: "aweme_general",
      enable_history: "1",
      keyword: keyword,
      search_source: "normal_search",
      query_correct_type: "1",
      is_filter_search: "0",
      from_group_id: "",
      disable_rs: "1",
      offset: String(offset),
      count: "10",
      need_filter_settings: "1",
      list_type: "",
      ...(searchId ? { search_id: searchId } : {}),
    },
    session,
    { sign: true, referer }
  );
}

/**
 * # Lấy chi tiết thông tin của một video/bài đăng qua aweme_id
 */
export async function getAwemeDetail(session: DouyinSession, awemeId: string): Promise<any> {
  return douyinGet("/aweme/v1/web/aweme/detail/", { aweme_id: awemeId }, session, { sign: true });
}

/**
 * # Lấy thông tin profile của creator khác
 */
export async function getCreatorProfile(session: DouyinSession, secUserId: string): Promise<any> {
  return douyinGet(
    "/aweme/v1/web/user/profile/other/",
    {
      sec_user_id: secUserId,
      publish_video_strategy_type: "2",
      personal_center_strategy: "1",
    },
    session,
    { sign: true }
  );
}

/**
 * # Lấy danh sách bài đăng của một creator
 */
export async function getCreatorPosts(
  session: DouyinSession,
  secUserId: string,
  cursor: string = "0"
): Promise<any> {
  return douyinGet(
    "/aweme/v1/web/aweme/post/",
    {
      sec_user_id: secUserId,
      count: "18",
      max_cursor: cursor,
      locate_query: "false",
      publish_video_strategy_type: "2",
    },
    session,
    { sign: true }
  );
}

/**
 * # Lấy danh sách bình luận cấp 1 của một video
 */
export async function getComments(
  session: DouyinSession,
  awemeId: string,
  cursor: number = 0
): Promise<any> {
  const referer = encodeURI(`https://www.douyin.com/search/抖音?aid=3a3cec5a-9e27-4040-b6aa-ef548c2c1138&publish_time=0&sort_type=0&source=search_history&type=general`);
  return douyinGet(
    "/aweme/v1/web/comment/list/",
    {
      aweme_id: awemeId,
      cursor: String(cursor),
      count: "20",
      item_type: "0",
    },
    session,
    { referer, sign: true }
  );
}

/**
 * # Lấy danh sách bình luận cấp con (phản hồi)
 */
export async function getReplyComments(
  session: DouyinSession,
  commentId: string,
  awemeId: string,
  cursor: number = 0
): Promise<any> {
  const referer = encodeURI(`https://www.douyin.com/search/抖音?aid=3a3cec5a-9e27-4040-b6aa-ef548c2c1138&publish_time=0&sort_type=0&source=search_history&type=general`);
  return douyinGet(
    "/aweme/v1/web/comment/list/reply/",
    {
      comment_id: commentId,
      cursor: String(cursor),
      count: "20",
      item_type: "0",
      item_id: awemeId,
    },
    session,
    { referer, sign: true }
  );
}
