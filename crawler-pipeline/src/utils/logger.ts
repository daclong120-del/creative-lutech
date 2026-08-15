/**
 * # Logger tập trung cho crawler pipeline
 * Ánh xạ từ ChinaMediaCrawler tools/utils.py init_loging_config()
 * Dùng console native — không cần thư viện logging bên ngoài
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = "info";

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").replace("Z", "");
}

function formatMsg(level: string, tag: string, msg: string): string {
  return `${timestamp()} [${level.toUpperCase()}] (${tag}) ${msg}`;
}

export function redactSecrets(val: any): any {
  if (val === undefined || val === null) return val;

  if (typeof val === "string") {
    let redacted = val;

    // Mask JWT tokens (Supabase service_role, anon keys, user tokens)
    redacted = redacted.replace(/eyJhbGciOi[a-zA-Z0-9_\-\.]*\.[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9_\-\.]+/gi, "[JWT_TOKEN_MASKED]");

    // Mask API Tokens (sm_live_...)
    redacted = redacted.replace(/(sm_live_[a-zA-Z0-9]{6,})/gi, (match) => {
      if (match.length <= 16) return "sm_live_***";
      return `${match.substring(0, 12)}...${match.substring(match.length - 4)}`;
    });

    // Mask msToken / xsec_token / api_token / xsecToken / xmst khi đi kèm từ nối tiếng Việt hoặc dấu phân tách bất kỳ
    redacted = redacted.replace(/(msToken|xsec_token|api_token|token|xsecToken|xmst)([\s]*[=:][\s]*|[^a-zA-Z0-9\n]{1,20})([a-zA-Z0-9_\-\.]{8,})/gi, (match, p1, p2, p3) => {
      if (match.includes("://") || match.includes("/")) {
        return match;
      }
      if (p3.length <= 8) return `${p1}${p2}***`;
      return `${p1}${p2}${p3.substring(0, 4)}...${p3.substring(p3.length - 4)}`;
    });

    // Mask Authorization header: Authorization: Bearer <token>
    redacted = redacted.replace(/(authorization)[=:\s'"`]+(bearer\s+)([a-zA-Z0-9_\-\.]+)/gi, (match, p1, p2, p3) => {
      if (p3.length <= 8) return `${p1}: ${p2}***`;
      return `${p1}: ${p2}${p3.substring(0, 4)}...${p3.substring(p3.length - 4)}`;
    });

    // Mask cookie / cookies / cookie_data (Tránh rò rỉ cookie có nhiều cặp phân tách bởi ;)
    // Dấu phân tách bắt buộc phải chứa = hoặc : để tránh khớp nhầm với ngôn ngữ tự nhiên
    // 1. Trường hợp có nháy bao quanh key và value (JSON style): "cookie": "a=1; b=2"
    redacted = redacted.replace(/(["'])(cookie_data|cookies|cookie)\1([\s]*[=:][\s]*)(["'])([^"'\n\r]+)\4/gi, '$1$2$1$3$4[MASKED]$4');
    // 2. Trường hợp key không nháy nhưng value có nháy: cookie: "a=1; b=2"
    redacted = redacted.replace(/(?<!["'])(cookie_data|cookies|cookie)([\s]*[=:][\s]*)(["'])([^"'\n\r]+)\3/gi, '$1$2$3[MASKED]$3');
    // 3. Trường hợp key và value đều không nháy: cookie=a=1; b=2
    redacted = redacted.replace(/(?<!["'])(cookie_data|cookies|cookie)([\s]*[=:][\s]*)([^"'\n\r\s,{}()\[\]][^"'\n\r,{}()\[\]]*)/gi, '$1$2[MASKED]');

    // Mask password
    redacted = redacted.replace(/(password|pass)([\s]*[=:][\s]*)(["']?)([^\s;\n\r"'}]+)\3/gi, '$1$2$3***$3');

    // Mask proxy string: host:port:username:password
    redacted = redacted.replace(/(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}):([^:\s\n]+):([^:\s\n]+)/g, (match, hostPort, user, pass) => {
      return `${hostPort}:${user}:***`;
    });

    // Generic Token Redactor: Mask bất kỳ chuỗi alphanumeric/base64 liên tục dài >= 20 ký tự (JWTs, API keys, hashes...)
    // Loại trừ URLs, paths và email
    redacted = redacted.replace(/(?<![a-zA-Z0-9\/\\@])([a-zA-Z0-9_\-\.]{20,})(?![a-zA-Z0-9])/g, (match) => {
      if (match.includes("http") || match.includes("://") || match.includes("/") || match.includes("\\") || match.includes("@")) {
        return match;
      }
      return `${match.substring(0, 4)}...${match.substring(match.length - 4)}`;
    });

    return redacted;
  }

  if (typeof val === "object") {
    try {
      return JSON.parse(redactSecrets(JSON.stringify(val)));
    } catch {
      return val;
    }
  }

  return val;
}

export const logger = {
  setLevel(level: LogLevel): void {
    currentLevel = level;
  },

  debug(msg: string, tag = "Crawler"): void {
    const redacted = redactSecrets(msg);
    if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) {
      console.debug(formatMsg("debug", tag, redacted));
    }
  },

  info(msg: string, tag = "Crawler"): void {
    const redacted = redactSecrets(msg);
    if (LOG_LEVELS.info >= LOG_LEVELS[currentLevel]) {
      console.info(formatMsg("info", tag, redacted));
    }
  },

  warn(msg: string, tag = "Crawler"): void {
    const redacted = redactSecrets(msg);
    if (LOG_LEVELS.warn >= LOG_LEVELS[currentLevel]) {
      console.warn(formatMsg("warn", tag, redacted));
    }
  },

  error(msg: string, tag = "Crawler"): void {
    const redacted = redactSecrets(msg);
    if (LOG_LEVELS.error >= LOG_LEVELS[currentLevel]) {
      console.error(formatMsg("error", tag, redacted));
    }
  },
};

