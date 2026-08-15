import { BilibiliMetricCollector } from "./bilibili/metric_collector.js";

export interface NormalizedPostMetrics {
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  raw?: any;
}

export interface NormalizedAuthorMetrics {
  fans_count: number;
  follows_count: number;
  interaction_count: number;
  videos_count: number;
  raw?: any;
}

export interface IMetricCollector {
  collectPostMetrics(platformPostId: string): Promise<NormalizedPostMetrics>;
  collectAuthorMetrics(platformAuthorId: string): Promise<NormalizedAuthorMetrics>;
}

export class MetricCollectorFactory {
  static get(platform: string): IMetricCollector | null {
    const plat = platform.toLowerCase();
    if (plat === "bilibili") {
      return new BilibiliMetricCollector();
    }
    return null;
  }
}
