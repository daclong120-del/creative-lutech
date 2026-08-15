export interface DouyinUrlList {
  url_list?: string[];
}

export interface DouyinAuthor {
  sec_uid?: string;
  nickname?: string;
  avatar_thumb?: DouyinUrlList;
  avatar_larger?: DouyinUrlList;
}

export interface DouyinAweme {
  aweme_id: string;
  desc?: string;
  create_time?: number;
  author?: DouyinAuthor;
  video?: {
    play_addr?: DouyinUrlList;
    cover?: DouyinUrlList;
  };
  images?: Array<{
    url_list?: string[];
    display_image_width_goods?: DouyinUrlList;
  }>;
  statistics?: {
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
    play_count?: number;
  };
}
