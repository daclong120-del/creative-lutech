/**
 * # CLI parser cho crawler pipeline — hỗ trợ multi-platform
 * Ánh xạ từ ChinaMediaCrawler cmd_arg/arg.py (Typer) → TypeScript process.argv parser
 * Không dùng thư viện CLI bên ngoài — giữ zero-dependency, parse thủ công
 */

import { PlatformType, CrawlType } from "../constant/index.js";

export interface CliArgs {
  platform: PlatformType;
  command: string;
  crawlType: CrawlType;
  target: string;
  keywords: string[];
  maxCount: number;
  maxComments: number;
  withReplies: boolean;
  headless: boolean;
  proxy: string;
  cookies: string;
}

const HELP_TEXT = `
Cách dùng: npx crawler <lệnh> [tùy chọn]

Lệnh:
  bootstrap [profileDir]                      Khởi tạo session trình duyệt
  crawl <url_or_id>                           Cào chi tiết 1 video/bài viết
  creator <url_or_id>                         Cào trang creator
  search <keyword> [max_count]                Tìm kiếm theo từ khóa
  comments <post_id> [max_count] [replies]    Cào bình luận

Tùy chọn:
  --platform <platform>    Nền tảng: douyin, bilibili, xhs, kuaishou, weibo, tieba, zhihu (mặc định: douyin)
  --headless               Chạy trình duyệt ẩn
  --no-headless            Hiện trình duyệt
  --proxy <url>            Proxy URL
  --cookies <string>       Cookie string
  --max-comments <n>       Số bình luận tối đa
  --with-replies           Bao gồm bình luận con
`;

/**
 * # Parse process.argv thành CliArgs có type-safety
 */
export function parseCliArgs(argv: string[] = process.argv.slice(2)): CliArgs {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  let platform = PlatformType.DOUYIN;
  let headless = true;
  let proxy = "";
  let cookies = "";
  let maxComments = 50;
  let withReplies = false;

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--platform" && argv[i + 1]) {
      const val = argv[++i] as PlatformType;
      if (Object.values(PlatformType).includes(val)) {
        platform = val;
      } else {
        console.error(`⚠️ Platform không hợp lệ: "${val}". Dùng mặc định: douyin`);
      }
    } else if (arg === "--headless") {
      headless = true;
    } else if (arg === "--no-headless") {
      headless = false;
    } else if (arg === "--proxy" && argv[i + 1]) {
      proxy = argv[++i];
    } else if (arg === "--cookies" && argv[i + 1]) {
      cookies = argv[++i];
    } else if (arg === "--max-comments" && argv[i + 1]) {
      maxComments = parseInt(argv[++i], 10) || 50;
    } else if (arg === "--with-replies") {
      withReplies = true;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  const command = positional[0] || "";
  const target = positional[1] || "";

  let crawlType: CrawlType;
  let keywords: string[] = [];
  let maxCount = 20;

  switch (command) {
    case "crawl":
      crawlType = CrawlType.DETAIL;
      break;
    case "creator":
      crawlType = CrawlType.CREATOR;
      break;
    case "search":
      crawlType = CrawlType.SEARCH;
      keywords = target ? target.split(",").map((k) => k.trim()) : [];
      maxCount = positional[2] ? parseInt(positional[2], 10) : 20;
      break;
    case "comments":
      crawlType = CrawlType.COMMENTS;
      maxCount = positional[2] ? parseInt(positional[2], 10) : 50;
      if (positional[3] === "true" || positional[3] === "1") {
        withReplies = true;
      }
      break;
    default:
      crawlType = CrawlType.SEARCH;
  }

  return {
    platform,
    command,
    crawlType,
    target,
    keywords,
    maxCount,
    maxComments,
    withReplies,
    headless,
    proxy,
    cookies,
  };
}
