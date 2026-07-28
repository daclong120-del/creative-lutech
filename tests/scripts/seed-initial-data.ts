import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(p: string) {
  try {
    const content = fs.readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {}
}

// Load env files in priority order
loadEnv(path.resolve(__dirname, "../../dashboard/.env.local"));
loadEnv(path.resolve(__dirname, "../../supabase/.env.local"));
loadEnv(path.resolve(__dirname, "../../.env"));
loadEnv(path.resolve(__dirname, "../../.env.local"));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ejwqyycoycyzuxseecck.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong biến môi trường.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log("🌱 Khởi chạy script nạp dữ liệu mẫu (Seed Data) vào Supabase...");
  console.log(`- Supabase URL: ${SUPABASE_URL}`);

  // 1. Nạp Tài khoản Crawler (crawler_accounts)
  console.log("\n1️⃣ Nạp danh sách tài khoản crawler (crawler_accounts)...");
  const accountsData = [
    {
      platform: "douyin",
      username: "douyin_bot_01",
      cookie_data: "msToken=seed_mstoken_01; sessionid=seed_session_01",
      status: "active",
      failure_count: 0
    },
    {
      platform: "zhihu",
      username: "zhihu_bot_01",
      cookie_data: "d_c0=seed_dc0_01; z_c0=seed_zc0_01",
      status: "active",
      failure_count: 0
    },
    {
      platform: "bilibili",
      username: "bilibili_bot_01",
      cookie_data: "SESSDATA=seed_sessdata_01; bili_jct=seed_jct_01",
      status: "active",
      failure_count: 0
    },
    {
      platform: "weibo",
      username: "weibo_bot_01",
      cookie_data: "SUB=seed_sub_01; SUBP=seed_subp_01",
      status: "active",
      failure_count: 0
    }
  ];

  const { data: insertedAccounts, error: accErr } = await supabase
    .from("crawler_accounts")
    .upsert(accountsData, { onConflict: "platform,username" })
    .select();

  if (accErr) {
    console.error("  ⚠️ Lỗi khi nạp crawler_accounts:", accErr.message);
  } else {
    console.log(`  ✅ Đã nạp ${insertedAccounts?.length || 0} tài khoản crawler.`);
  }

  // 2. Nạp Nhiệm vụ Crawler (crawler_tasks)
  console.log("\n2️⃣ Nạp danh sách nhiệm vụ mẫu (crawler_tasks)...");
  const tasksData = [
    {
      platform: "douyin",
      command: "search",
      target: "chuyển đổi giọng nói AI",
      max_count: 20,
      status: "completed",
      priority: "high"
    },
    {
      platform: "douyin",
      command: "search",
      target: "tài chính cá nhân 2026",
      max_count: 50,
      status: "pending",
      priority: "normal"
    },
    {
      platform: "zhihu",
      command: "crawl",
      target: "https://www.zhihu.com/question/58912345",
      max_count: 30,
      status: "running",
      priority: "normal"
    },
    {
      platform: "bilibili",
      command: "search",
      target: "phim ngắn kinh dị",
      max_count: 20,
      status: "completed",
      priority: "high"
    },
    {
      platform: "weibo",
      command: "search",
      target: "xu hướng công nghệ SinoMedia",
      max_count: 15,
      status: "pending",
      priority: "low"
    }
  ];

  const { data: insertedTasks, error: taskErr } = await supabase
    .from("crawler_tasks")
    .insert(tasksData)
    .select();

  if (taskErr) {
    console.error("  ⚠️ Lỗi khi nạp crawler_tasks:", taskErr.message);
  } else {
    console.log(`  ✅ Đã nạp ${insertedTasks?.length || 0} nhiệm vụ cào mẫu.`);
  }

  // 3. Nạp Tác giả (crawled_authors)
  console.log("\n3️⃣ Nạp danh sách tác giả mẫu (crawled_authors)...");
  const authorsData = [
    {
      id: "dy_author_001",
      platform: "douyin",
      platform_uid: "MS4wLjABAAAA_douyin_creator_01",
      nickname: "Kênh Công Nghệ AI",
      description: "Chia sẻ kiến thức AI & Công nghệ mới nhất",
      fans_count: 125000,
      follows_count: 85,
      ip_location: "Bắc Kinh",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    {
      id: "zh_author_001",
      platform: "zhihu",
      platform_uid: "zhihu_expert_ai",
      nickname: "Chuyên Gia Thuật Toán Zhihu",
      description: "Tác giả hàng đầu chủ đề Trí tuệ nhân tạo",
      fans_count: 45000,
      follows_count: 120,
      ip_location: "Thượng Hải",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    {
      id: "bili_author_001",
      platform: "bilibili",
      platform_uid: "12345678",
      nickname: "Kênh Bilibili Phim Ngắn",
      description: "UP chủ sáng tạo nội dung giải trí",
      fans_count: 89000,
      follows_count: 42,
      ip_location: "Thâm Quyến",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    }
  ];

  const { data: insertedAuthors, error: authorErr } = await supabase
    .from("crawled_authors")
    .upsert(authorsData, { onConflict: "id" })
    .select();

  if (authorErr) {
    console.error("  ⚠️ Lỗi khi nạp crawled_authors:", authorErr.message);
  } else {
    console.log(`  ✅ Đã nạp ${insertedAuthors?.length || 0} tác giả mẫu.`);
  }

  // 4. Nạp Bài viết / Video mẫu (crawled_posts)
  console.log("\n4️⃣ Nạp danh sách bài viết / sáng tạo mẫu (crawled_posts)...");
  const postsData = [
    {
      id: "dy_post_73849102",
      platform: "douyin",
      platform_id: "738491029384",
      author_id: "dy_author_001",
      title: "Ứng dụng chuyển đổi giọng nói bằng AI cực chuẩn 2026",
      caption: "Trải nghiệm tính năng Voice Changer thế hệ mới cực đỉnh! #AI #VoiceChanger #SinoMedia",
      cover_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
      media_urls: ["https://v1.douyin.com/sample_video_01.mp4"],
      content_type: "video",
      source_url: "https://www.douyin.com/video/738491029384",
      media_type: "video",
      media_status: "original_only",
      stats: {
        digg_count: 15400,
        comment_count: 890,
        share_count: 1200,
        collect_count: 3400
      },
      published_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "zh_answer_98765432",
      platform: "zhihu",
      platform_id: "98765432",
      author_id: "zh_author_001",
      title: "Làm thế nào để xây dựng hệ thống Crawler lai linh hoạt?",
      caption: "Bài phân tích chi tiết về kiến trúc crawler lai kết hợp HTTP API và Browser context cho Douyin & Zhihu...",
      cover_url: null,
      media_urls: [],
      content_type: "answer",
      source_url: "https://www.zhihu.com/question/58912345/answer/98765432",
      media_type: "text",
      media_status: "not_applicable",
      stats: {
        digg_count: 3400,
        comment_count: 145,
        share_count: 520,
        collect_count: 1800
      },
      published_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: "bili_post_BV1xx411c7",
      platform: "bilibili",
      platform_id: "BV1xx411c7",
      author_id: "bili_author_001",
      title: "Top 5 Kịch bản kinh dị ngắn đỉnh cao năm 2026",
      caption: "Tổng hợp những đoạn phim ngắn gây cấn và hấp dẫn trên Bilibili #bilibili #horror",
      cover_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600",
      media_urls: ["https://player.bilibili.com/player.html?bvid=BV1xx411c7"],
      content_type: "video",
      source_url: "https://www.bilibili.com/video/BV1xx411c7",
      media_type: "video",
      media_status: "original_only",
      stats: {
        digg_count: 42000,
        comment_count: 2300,
        share_count: 5600,
        collect_count: 12000
      },
      published_at: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];

  const { data: insertedPosts, error: postErr } = await supabase
    .from("crawled_posts")
    .upsert(postsData, { onConflict: "id" })
    .select();

  if (postErr) {
    console.error("  ⚠️ Lỗi khi nạp crawled_posts:", postErr.message);
  } else {
    console.log(`  ✅ Đã nạp ${insertedPosts?.length || 0} bài viết / sáng tạo mẫu.`);
  }

  // 5. Nạp Log Vận Hành mẫu (crawler_logs) nếu có nhiệm vụ vừa nạp
  if (insertedTasks && insertedTasks.length > 0) {
    console.log("\n5️⃣ Nạp danh sách log vận hành mẫu (crawler_logs)...");
    const sampleTaskId = insertedTasks[0].id;
    const logsData = [
      {
        task_id: sampleTaskId,
        level: "info",
        message: "Nhiệm vụ cào được khởi tạo từ hệ thống quản trị SinoMedia"
      },
      {
        task_id: sampleTaskId,
        level: "info",
        message: "Worker đã claim thành công nhiệm vụ, bắt đầu tiến trình HTTP API crawler"
      },
      {
        task_id: sampleTaskId,
        level: "info",
        message: "Crawl thành công 20 dữ liệu bài viết mới"
      }
    ];

    const { data: insertedLogs, error: logErr } = await supabase
      .from("crawler_logs")
      .insert(logsData)
      .select();

    if (logErr) {
      console.error("  ⚠️ Lỗi khi nạp crawler_logs:", logErr.message);
    } else {
      console.log(`  ✅ Đã nạp ${insertedLogs?.length || 0} dòng log mẫu.`);
    }
  }

  console.log("\n🎉 Quá trình nạp dữ liệu mẫu vào Supabase đã hoàn tất thành công!");
}

main().catch((err) => {
  console.error("❌ Lỗi không xác định khi nạp dữ liệu Supabase:", err);
  process.exit(1);
});
