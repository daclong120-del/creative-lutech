/**
 * # Cấu hình riêng cho Douyin crawler
 * Mở rộng từ BaseConfig, thêm các tham số đặc thù Douyin
 */

import { createBaseConfig, type BaseConfig } from "./base.config.js";
import { PlatformType } from "../constant/index.js";

export interface DouyinConfig extends BaseConfig {
  cookiePath: string;
  profileDir: string;
  creatorMaxPosts: number;
  enableCreatorDetail: boolean;
}

/**
 * # Tạo cấu hình Douyin từ biến môi trường và giá trị mặc định
 */
export function createDouyinConfig(overrides?: Partial<DouyinConfig>): DouyinConfig {
  const base = createBaseConfig({ platform: PlatformType.DOUYIN });
  return {
    ...base,
    cookiePath: process.env.DOUYIN_COOKIE_PATH || "",
    profileDir: process.env.DOUYIN_PROFILE_DIR || "output/profiles/douyin",
    creatorMaxPosts: process.env.CREATOR_MAX_POSTS ? parseInt(process.env.CREATOR_MAX_POSTS, 10) : Infinity,
    enableCreatorDetail: process.env.ENABLE_CREATOR_DETAIL !== "false",
    ...overrides,
  };
}
