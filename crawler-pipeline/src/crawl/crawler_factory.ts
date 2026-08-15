import { PlatformType } from "../constant/index.js";
import type { ICrawler } from "../base/base_crawler.js";
import { DouyinCrawler } from "./douyin/index.js";
import { BilibiliCrawler } from "./bilibili/index.js";
import { KuaishouCrawler } from "./kuaishou/index.js";
import { TiebaCrawler } from "./tieba/index.js";
import { WeiboCrawler } from "./weibo/index.js";
import { XhsCrawler } from "./xhs/index.js";
import { ZhihuCrawler } from "./zhihu/index.js";

/**
 * # Nhà máy sản xuất (Factory) instance crawler dựa trên nền tảng
 */
export class CrawlerFactory {
  /**
   * # Khởi tạo và trả về crawler tương ứng cho từng nền tảng mạng xã hội
   */
  static create(platform: string): ICrawler {
    switch (platform) {
      case PlatformType.DOUYIN:
        return new DouyinCrawler();
      case PlatformType.BILIBILI:
        return new BilibiliCrawler();
      case PlatformType.KUAISHOU:
        return new KuaishouCrawler();
      case PlatformType.TIEBA:
        return new TiebaCrawler();
      case PlatformType.WEIBO:
        return new WeiboCrawler();
      case PlatformType.XHS:
        return new XhsCrawler();
      case PlatformType.ZHIHU:
        return new ZhihuCrawler();
      default:
        throw new Error(`Nền tảng "${platform}" chưa được hỗ trợ bởi hệ thống Crawler Factory.`);
    }
  }
}
