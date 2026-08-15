/**
 * # Cấu hình riêng cho Tieba (Baidu Tieba) crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù Tieba
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface TiebaConfig extends BaseConfig {
  specifiedIdList: string[];
  creatorUrlList: string[];
  tiebaNameList: string[];
}

/**
 * # Tạo cấu hình Tieba từ biến môi trường và giá trị mặc định
 */
export function createTiebaConfig(overrides?: Partial<TiebaConfig>): TiebaConfig {
  const base = createBaseConfig({ platform: PlatformType.TIEBA });
  return {
    ...base,
    specifiedIdList: [],
    creatorUrlList: [],
    tiebaNameList: [],
    ...overrides,
  };
}
