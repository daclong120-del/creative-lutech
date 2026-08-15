/**
 * # Cấu hình riêng cho Kuaishou crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù Kuaishou
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface KuaishouConfig extends BaseConfig {
  specifiedIdList: string[];
  creatorIdList: string[];
}

/**
 * # Tạo cấu hình Kuaishou từ biến môi trường và giá trị mặc định
 */
export function createKuaishouConfig(overrides?: Partial<KuaishouConfig>): KuaishouConfig {
  const base = createBaseConfig({ platform: PlatformType.KUAISHOU });
  return {
    ...base,
    specifiedIdList: [],
    creatorIdList: [],
    ...overrides,
  };
}
