/**
 * # Cấu hình chung cho mọi platform crawler
 * Kế thừa và mở rộng bởi config riêng từng platform (douyin.config.ts, ...)
 */

import { CONFIG } from "../config.js";
import { PlatformType, CrawlType, SortType, CRAWL_DEFAULTS } from "../constant/index.js";

export interface BaseConfig {
  platform: PlatformType;
  crawlType: CrawlType;
  headless: boolean;
  proxy: string;
  maxPage: number;
  maxComments: number;
  sleepMs: number;
  sortType: SortType;
  keywords: string[];
  enableGetComments: boolean;
}

/**
 * # Tạo cấu hình mặc định từ biến môi trường và giá trị mặc định
 */
export function createBaseConfig(overrides?: Partial<BaseConfig>): BaseConfig {
  return {
    platform: PlatformType.DOUYIN,
    crawlType: CrawlType.SEARCH,
    headless: CONFIG.headless,
    proxy: CONFIG.proxy,
    maxPage: CRAWL_DEFAULTS.maxPage,
    maxComments: CRAWL_DEFAULTS.maxComments,
    sleepMs: CRAWL_DEFAULTS.sleepMs,
    sortType: SortType.DEFAULT,
    keywords: [],
    enableGetComments: false,
    ...overrides,
  };
}
