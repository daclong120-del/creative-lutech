/**
 * # Cấu hình riêng cho Xiaohongshu (XHS) crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù XHS
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface XhsConfig extends BaseConfig {
  specifiedNoteUrlList: string[];
  creatorIdList: string[];
  xhsSortType: string;
}

/**
 * # Tạo cấu hình XHS từ biến môi trường và giá trị mặc định
 */
export function createXhsConfig(overrides?: Partial<XhsConfig>): XhsConfig {
  const base = createBaseConfig({ platform: PlatformType.XHS });
  return {
    ...base,
    specifiedNoteUrlList: [],
    creatorIdList: [],
    xhsSortType: "popularity_descending",
    ...overrides,
  };
}
