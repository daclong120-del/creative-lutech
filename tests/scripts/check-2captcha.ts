import "../../crawler-pipeline/src/config.js";

async function checkBalance() {
  const apiKey = process.env.TWOCAPTCHA_API_KEY;
  if (!apiKey) {
    console.error("Missing TWOCAPTCHA_API_KEY");
    process.exit(1);
  }

  console.log("=============================================================");
  console.log("🔑 CHECKING 2CAPTCHA API KEY & BALANCE");
  console.log("=============================================================");
  console.log("Key:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));

  const url = `https://2captcha.com/res.php?key=${apiKey}&action=getbalance&json=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("\n2Captcha API Response:", JSON.stringify(data, null, 2));
    if (data.status === 1) {
      console.log(`\n✅ Key 2Captcha HỢP LỆ! Số dư khả dụng: $${data.request} USD`);
    } else {
      console.error(`\n❌ Key 2Captcha LỖI hoặc KHÔNG HỢP LỆ: ${data.request}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error("❌ Lỗi kết nối tới 2Captcha API:", err.message);
    process.exit(1);
  }
}

checkBalance();
