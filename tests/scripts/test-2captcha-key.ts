import { TwoCaptchaProvider } from "../../crawler-pipeline/src/challenge/providers/two_captcha.js";

async function checkBalance() {
  const apiKey = "1156f180a0529d6d003ecf02584dada7";
  const provider = new TwoCaptchaProvider(apiKey);
  console.log("Kiểm tra API Key 2Captcha...");
  const balance = await provider.getBalance();
  console.log(`✅ API Key 2Captcha HỢP LỆ! Số dư hiện tại: $${balance} USD`);
}

checkBalance().catch(err => {
  console.error("❌ Lỗi kiểm tra API Key 2Captcha:", err.message);
  process.exit(1);
});
