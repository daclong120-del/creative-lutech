/**
 * # Cấu hình riêng cho Zhihu crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù Zhihu
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface ZhihuConfig extends BaseConfig {
  specifiedIdList: string[];
  creatorUrlList: string[];
}

/**
 * # Tạo cấu hình Zhihu từ biến môi trường và giá trị mặc định
 */
export function createZhihuConfig(overrides?: Partial<ZhihuConfig>): ZhihuConfig {
  const base = createBaseConfig({ platform: PlatformType.ZHIHU });
  return {
    ...base,
    specifiedIdList: [],
    creatorUrlList: [],
    ...overrides,
  };
}
