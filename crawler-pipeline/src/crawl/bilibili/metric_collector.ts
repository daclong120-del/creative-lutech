import { bilibiliGet } from "./client.js";
import { IMetricCollector, NormalizedPostMetrics, NormalizedAuthorMetrics } from "../metric_collector.js";

export class BilibiliMetricCollector implements IMetricCollector {
  async collectPostMetrics(platformPostId: string): Promise<NormalizedPostMetrics> {
    const detailRes = await bilibiliGet(
      "/x/web-interface/view/detail",
      { bvid: platformPostId },
      false
    );

    const view = detailRes.View;
    if (!view) {
      throw new Error(`Phản hồi chi tiết video không có trường View cho bvid: ${platformPostId}`);
    }

    const stat = view.stat || {};
    return {
      view_count: Number(stat.view ?? 0),
      like_count: Number(stat.like ?? 0),
      comment_count: Number(stat.reply ?? 0),
      share_count: Number(stat.share ?? 0),
      raw: detailRes,
    };
  }

  async collectAuthorMetrics(platformAuthorId: string): Promise<NormalizedAuthorMetrics> {
    // 1. Lấy thông tin quan hệ (follower, following)
    // Nếu lỗi API này thì không bắt lỗi mà để ném lên trên, ngăn chặn việc cập nhật followers về 0.
    const relationRes = await bilibiliGet(
      "/x/relation/stat",
      { vmid: platformAuthorId },
      false
    );
    if (!relationRes) {
      throw new Error(`relationRes trống cho Bilibili UID ${platformAuthorId}`);
    }
    const fans_count = Number(relationRes.follower ?? 0);
    const follows_count = Number(relationRes.following ?? 0);

    // 2. Lấy thông tin acc info (nickname, avatar, description)
    let rawAccInfo: any = null;
    try {
      rawAccInfo = await bilibiliGet(
        "/x/space/wbi/acc/info",
        { mid: platformAuthorId },
        true
      );
    } catch (err: any) {
      console.error(`Lỗi khi lấy acc info cho Bilibili UID ${platformAuthorId}: ${err.message}`);
    }

    return {
      fans_count,
      follows_count,
      interaction_count: 0, // Bilibili không cung cấp tổng lượt tương tác tác giả trực tiếp ở đây
      videos_count: 0, // Có thể lấy qua arc search nhưng để giữ gọn ta mặc định 0 ở bước refresh
      raw: {
        relation: relationRes,
        acc_info: rawAccInfo || {},
      },
    };
  }
}
