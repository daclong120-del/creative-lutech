/**
 * # Barrel export cho toàn bộ config của crawler pipeline
 * Import gọn: import { createDouyinConfig, createBilibiliConfig } from "../config/index.js"
 */

export { type BaseConfig, createBaseConfig } from "./base.config.js";
export { type DouyinConfig, createDouyinConfig } from "./douyin.config.js";
export { type BilibiliConfig, createBilibiliConfig } from "./bilibili.config.js";
export { type XhsConfig, createXhsConfig } from "./xhs.config.js";
export { type KuaishouConfig, createKuaishouConfig } from "./kuaishou.config.js";
export { type WeiboConfig, createWeiboConfig } from "./weibo.config.js";
export { type TiebaConfig, createTiebaConfig } from "./tieba.config.js";
export { type ZhihuConfig, createZhihuConfig } from "./zhihu.config.js";
