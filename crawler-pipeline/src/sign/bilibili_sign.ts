/**
 * # Thuật toán sinh chữ ký WBI cho Bilibili API
 * Viết lại từ help.py sang TypeScript thuần
 */

import crypto from "node:crypto";

const MAP_TABLE = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
];

/**
 * # Lấy khóa muối (salted key) từ imgKey và subKey
 */
export function getSalt(imgKey: string, subKey: string): string {
  let salt = "";
  const mixinKey = imgKey + subKey;
  for (const index of MAP_TABLE) {
    if (index < mixinKey.length) {
      salt += mixinKey[index];
    }
  }
  return salt.slice(0, 32);
}

/**
 * # Ký các tham số request WBI của Bilibili
 */
export function getWbiSign(
  params: Record<string, any>,
  imgKey: string,
  subKey: string
): Record<string, any> {
  const currentTs = Math.floor(Date.now() / 1000);
  const reqData: Record<string, any> = { ...params, wts: currentTs };

  const sortedKeys = Object.keys(reqData).sort();
  const filteredData: Record<string, string> = {};

  for (const key of sortedKeys) {
    const val = reqData[key];
    if (val !== undefined && val !== null) {
      const valStr = String(val);
      let cleanVal = "";
      for (let i = 0; i < valStr.length; i++) {
        const ch = valStr[i];
        if (!"!'()*".includes(ch)) {
          cleanVal += ch;
        }
      }
      filteredData[key] = cleanVal;
    }
  }

  const query = Object.keys(filteredData)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(filteredData[key])}`)
    .join("&");
  
  const salt = getSalt(imgKey, subKey);
  const wRid = crypto
    .createHash("md5")
    .update(query + salt)
    .digest("hex");

  return { ...filteredData, w_rid: wRid };
}
