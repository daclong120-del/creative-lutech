/**
 * # Cấu hình riêng cho Weibo crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù Weibo
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface WeiboConfig extends BaseConfig {
  specifiedIdList: string[];
  creatorIdList: string[];
  weiboSearchType: string;
  enableFullText: boolean;
}

/**
 * # Tạo cấu hình Weibo từ biến môi trường và giá trị mặc định
 */
export function createWeiboConfig(overrides?: Partial<WeiboConfig>): WeiboConfig {
  const base = createBaseConfig({ platform: PlatformType.WEIBO });
  return {
    ...base,
    specifiedIdList: [],
    creatorIdList: [],
    weiboSearchType: "default",
    enableFullText: true,
    ...overrides,
  };
}
