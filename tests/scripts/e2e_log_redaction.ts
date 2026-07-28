import { logger, redactSecrets } from "../src/utils/index.js";

async function main() {
  console.log("=== BẮT ĐẦU CHẠY KIỂM THỬ E2E LOG REDACTION (MOCK INTEGRATION) ===");

  // Mock database in-memory
  const mockDbLogs: Array<{ level: string; message: string }> = [];

  async function writeLogToDb(level: string, message: string) {
    // Giả lập ghi nhận vào DB
    mockDbLogs.push({ level, message });
  }

  // Ghi đè logger methods giống queue_worker.ts
  const originalInfo = logger.info;
  const originalError = logger.error;

  logger.info = (msg: string, tag?: string) => {
    const redacted = redactSecrets(msg);
    originalInfo(redacted, tag);
    writeLogToDb("info", `[${tag || "Crawler"}] ${redacted}`);
  };

  logger.error = (msg: string, tag?: string) => {
    const redacted = redactSecrets(msg);
    originalError(redacted, tag);
    writeLogToDb("error", `[${tag || "Crawler"}] ${redacted}`);
  };

  // 3. Thực thi in các logs nhạy cảm
  console.log("Đang giả lập in logs nhạy cảm...");
  
  logger.info("Kiểm thử Cookie thô: Cookie=session=xyz; token=abc; expires=tomorrow", "E2E");
  logger.info("Kiểm thử Cookie JSON: {\"cookie\": \"session=xyz; secure=true\"}", "E2E");
  logger.info("Kiểm thử msToken kèm từ nối tiếng Việt: msToken lấy được: abcde1234567890fghij", "E2E");
  logger.info("Kiểm thử proxy credentials: 1.2.3.4:8080:username:password", "E2E");
  logger.info("Kiểm thử JWT service role key: " + ("ey" + "JhbGciOiJKV1Q.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"), "E2E");
  const fakeApiToken = "sm_" + "live_" + "abcdef1234567890abcdef1234567890abcdef1234";
  logger.info(`Kiểm thử API Token thô: ${fakeApiToken}`, "E2E");

  // 4. Kiểm tra logs được lưu trong database
  let success = true;
  
  console.log(`\n=== KẾT QUẢ TRUY VẤN TỪ MOCK DATABASE (${mockDbLogs.length} logs) ===`);
  
  const expectations = [
    {
      keyword: "Cookie thô",
      expected: "[E2E] Kiểm thử Cookie thô: Cookie=[MASKED]"
    },
    {
      keyword: "Cookie JSON",
      expected: "[E2E] Kiểm thử Cookie JSON: {\"cookie\": \"[MASKED]\"}"
    },
    {
      keyword: "msToken lấy được",
      expected: "[E2E] Kiểm thử msToken kèm từ nối tiếng Việt: msToken lấy được: abcd...ghij"
    },
    {
      keyword: "proxy credentials",
      expected: "[E2E] Kiểm thử proxy credentials: 1.2.3.4:8080:username:***"
    },
    {
      keyword: "JWT",
      expected: "[E2E] Kiểm thử JWT service role key: [JWT_TOKEN_MASKED]"
    },
    {
      keyword: "API Token thô",
      expected: "[E2E] Kiểm thử API Token thô: sm_live_abcd...1234"
    }
  ];

  for (const exp of expectations) {
    const dbLog = mockDbLogs.find((l: any) => l.message.includes(exp.keyword));
    if (!dbLog) {
      console.error(`❌ THẤT BẠI: Không tìm thấy log chứa từ khoá "${exp.keyword}" trong Mock DB`);
      success = false;
    } else {
      if (dbLog.message !== exp.expected) {
        console.error(`❌ THẤT BẠI: Log trong Mock DB không khớp cấu trúc làm sạch!\n   Thật: "${dbLog.message}"\n   Muốn: "${exp.expected}"`);
        success = false;
      } else {
        console.log(`\n✅ ĐẠT YÊU CẦU: Log trong Mock DB: "${dbLog.message}"`);
      }
    }
  }

  // Restore logger methods
  logger.info = originalInfo;
  logger.error = originalError;

  if (success) {
    console.log("\n🎉 HOÀN THÀNH: KIỂM THỬ E2E LOG REDACTION ĐẠT 100% YÊU CẦU BẢO MẬT!");
    process.exit(0);
  } else {
    console.error("\n❌ KIỂM THỬ E2E THẤT BẠI!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
