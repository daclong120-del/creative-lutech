/**
 * # Cấu hình riêng cho Bilibili crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù Bilibili
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface BilibiliConfig extends BaseConfig {
  specifiedIdList: string[];
  creatorIdList: string[];
  searchMode: string;
  videoQuality: number;
  maxContactsPerNote: number;
  maxDynamicsPerNote: number;
}

/**
 * # Tạo cấu hình Bilibili từ biến môi trường và giá trị mặc định
 */
export function createBilibiliConfig(overrides?: Partial<BilibiliConfig>): BilibiliConfig {
  const base = createBaseConfig({ platform: PlatformType.BILIBILI });
  return {
    ...base,
    specifiedIdList: [],
    creatorIdList: [],
    searchMode: "normal",
    videoQuality: 80,
    maxContactsPerNote: 100,
    maxDynamicsPerNote: 50,
    ...overrides,
  };
}
