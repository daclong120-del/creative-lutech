import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const cookiePath = join(process.cwd(), "scratch", "cookie_doyin.json");
  console.log(`Reading cookies from: ${cookiePath}`);
  
  const content = readFileSync(cookiePath, "utf8").trim();
  const data = JSON.parse(content);
  
  if (Array.isArray(data)) {
    console.log("Found raw cookies array. Wrapping it...");
    const wrapped = {
      cookies: data,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
      webid: "7657495526275368502",
      msToken: "qka7p_Ym3X3tuYGdZD1j3ND2trCxvLa9lbJXV_6Qp0gt8LI7mNIlTbvqEQ5ZbCH2iDz0j6cEa3Lg8jdzVr_87a2CMe9m_UhnjzVONKb_BdDN6SBgyAQlDcSuOaVn_yVzgWE0XXb2YHuAfetCyzChl7I6bJt-AO4IVvoFb3llkvpXyNJ3LwBQKA==",
      verifyFp: "verify_mr1welj0_Taw6lGuA_iVeN_4dp5_AyTE_nQa8W2FI4uY6",
      fp: "verify_mr1welj0_Taw6lGuA_iVeN_4dp5_AyTE_nQa8W2FI4uY6",
      browserName: "Chrome",
      browserVersion: "150.0.0.0",
      browserPlatform: "Win32",
      browserLanguage: "zh-CN",
      screenWidth: 1920,
      screenHeight: 1080
    };
    writeFileSync(cookiePath, JSON.stringify(wrapped, null, 2), "utf8");
    console.log("Successfully wrapped cookie_doyin.json!");
  } else if (data && typeof data === "object") {
    console.log("Found wrapped session object. Updating properties...");
    data.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";
    data.webid = "7657495526275368502";
    data.msToken = "qka7p_Ym3X3tuYGdZD1j3ND2trCxvLa9lbJXV_6Qp0gt8LI7mNIlTbvqEQ5ZbCH2iDz0j6cEa3Lg8jdzVr_87a2CMe9m_UhnjzVONKb_BdDN6SBgyAQlDcSuOaVn_yVzgWE0XXb2YHuAfetCyzChl7I6bJt-AO4IVvoFb3llkvpXyNJ3LwBQKA==";
    data.browserVersion = "150.0.0.0";
    writeFileSync(cookiePath, JSON.stringify(data, null, 2), "utf8");
    console.log("Successfully updated cookie_doyin.json!");
  }
}

main().catch(console.error);
