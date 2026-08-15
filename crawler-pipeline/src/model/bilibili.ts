/**
 * # Type definitions cho dữ liệu API response của Bilibili
 * Ánh xạ từ ChinaMediaCrawler models.py: BilibiliVideo, BilibiliVideoComment, BilibiliUpInfo
 */

export interface BilibiliUrlList {
  url_list?: string[];
}

export interface BilibiliAuthor {
  mid?: number;
  name?: string;
  face?: string;
  sex?: string;
  sign?: string;
}

export interface BilibiliVideo {
  bvid?: string;
  aid?: number;
  title?: string;
  desc?: string;
  pubdate?: number;
  owner?: BilibiliAuthor;
  stat?: {
    view?: number;
    danmaku?: number;
    reply?: number;
    favorite?: number;
    coin?: number;
    share?: number;
    like?: number;
    dislike?: number;
  };
  pic?: string;
  dynamic?: string;
  tname?: string;
  duration?: number;
}

export interface BilibiliComment {
  rpid?: number;
  oid?: number;
  mid?: number;
  content?: {
    message?: string;
  };
  ctime?: number;
  like?: number;
  rcount?: number;
  parent?: number;
  member?: {
    mid?: string;
    uname?: string;
    avatar?: string;
    sex?: string;
    sign?: string;
  };
}

export interface BilibiliUpInfo {
  mid?: number;
  name?: string;
  face?: string;
  sex?: string;
  sign?: string;
  fans?: number;
  like?: number;
  level?: number;
  official?: {
    type?: number;
  };
}

export interface BilibiliDynamic {
  id_str?: string;
  modules?: {
    module_author?: {
      mid?: number;
      name?: string;
    };
    module_dynamic?: {
      desc?: {
        text?: string;
      };
    };
    module_stat?: {
      comment?: { count?: number };
      forward?: { count?: number };
      like?: { count?: number };
    };
  };
  type?: string;
  pub_ts?: number;
}
