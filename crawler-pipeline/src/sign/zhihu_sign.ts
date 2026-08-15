/**
 * # Thuật toán sinh chữ ký x-zse-96 cho Zhihu API
 * Viết lại từ zhihu.js (reverse-engineered) sang TypeScript thuần
 * Bao gồm: SM4 block cipher biến thể, x-zse-96 generator
 */

import crypto from "node:crypto";

const INIT_STR = "6fpLRqJO8M/c3jnYxFkUVC4ZIG12SiH=5v0mXDazWBTsuw7QetbKdoPyAl+hN9rgE";

const ZK: readonly number[] = [
  1170614578, 1024848638, 1413669199, -343334464, -766094290, -1373058082, -143119608, -297228157,
  1933479194, -971186181, -406453910, 460404854, -547427574, -1891326262, -1679095901, 2119585428,
  -2029270069, 2035090028, -1521520070, -5587175, -77751101, -2094365853, -1243052806, 1579901135,
  1321810770, 456816404, -1391643889, -229302305, 330002838, -788960546, 363569021, -1947871109,
];

const ZB: readonly number[] = [
  20, 223, 245, 7, 248, 2, 194, 209, 87, 6, 227, 253, 240, 128, 222, 91, 237, 9, 125, 157, 230, 93,
  252, 205, 90, 79, 144, 199, 159, 197, 186, 167, 39, 37, 156, 198, 38, 42, 43, 168, 217, 153, 15,
  103, 80, 189, 71, 191, 97, 84, 247, 95, 36, 69, 14, 35, 12, 171, 28, 114, 178, 148, 86, 182, 32,
  83, 158, 109, 22, 255, 94, 238, 151, 85, 77, 124, 254, 18, 4, 26, 123, 176, 232, 193, 131, 172,
  143, 142, 150, 30, 10, 146, 162, 62, 224, 218, 196, 229, 1, 192, 213, 27, 110, 56, 231, 180, 138,
  107, 242, 187, 54, 120, 19, 44, 117, 228, 215, 203, 53, 239, 251, 127, 81, 11, 133, 96, 204, 132,
  41, 115, 73, 55, 249, 147, 102, 48, 122, 145, 106, 118, 74, 190, 29, 16, 174, 5, 177, 129, 63, 113,
  99, 31, 161, 76, 246, 34, 211, 13, 60, 68, 207, 160, 65, 111, 82, 165, 67, 169, 225, 57, 112, 244,
  155, 51, 236, 200, 233, 58, 61, 47, 100, 137, 185, 64, 17, 70, 234, 163, 219, 108, 170, 166, 59,
  149, 52, 105, 24, 212, 78, 173, 45, 0, 116, 226, 119, 136, 206, 135, 175, 195, 25, 92, 121, 208,
  126, 139, 3, 75, 141, 21, 130, 98, 241, 40, 154, 66, 184, 49, 181, 46, 243, 88, 101, 183, 8, 23,
  72, 188, 104, 179, 210, 134, 250, 201, 164, 89, 216, 202, 220, 50, 221, 152, 140, 33, 235, 214,
];

function intToBytes(e: number, t: number[], n: number): void {
  t[n] = 255 & e >>> 24;
  t[n + 1] = 255 & e >>> 16;
  t[n + 2] = 255 & e >>> 8;
  t[n + 3] = 255 & e;
}

function rotateLeft(e: number, t: number): number {
  return (4294967295 & e) << t | e >>> 32 - t;
}

function bytesToInt(e: number[], t: number): number {
  return (255 & e[t]) << 24 | (255 & e[t + 1]) << 16 | (255 & e[t + 2]) << 8 | 255 & e[t + 3];
}

function transformG(e: number): number {
  const t = new Array(4);
  const n = new Array(4);
  intToBytes(e, t, 0);
  n[0] = ZB[255 & t[0]];
  n[1] = ZB[255 & t[1]];
  n[2] = ZB[255 & t[2]];
  n[3] = ZB[255 & t[3]];
  const r = bytesToInt(n, 0);
  return r ^ rotateLeft(r, 2) ^ rotateLeft(r, 10) ^ rotateLeft(r, 18) ^ rotateLeft(r, 24);
}

function array0_16Offset(e: number[]): number[] {
  const t = new Array(16);
  const n = new Array(36);
  n[0] = bytesToInt(e, 0);
  n[1] = bytesToInt(e, 4);
  n[2] = bytesToInt(e, 8);
  n[3] = bytesToInt(e, 12);
  for (let r = 0; r < 32; r++) {
    const o = transformG(n[r + 1] ^ n[r + 2] ^ n[r + 3] ^ ZK[r]);
    n[r + 4] = n[r] ^ o;
  }
  intToBytes(n[35], t, 0);
  intToBytes(n[34], t, 4);
  intToBytes(n[33], t, 8);
  intToBytes(n[32], t, 12);
  return t;
}

function array16_48Offset(e: number[], t: number[]): number[] {
  let n: number[] = [];
  let r = e.length;
  let i = 0;
  while (r > 0) {
    const o = e.slice(16 * i, 16 * (i + 1));
    const a = new Array(16);
    for (let c = 0; c < 16; c++) {
      a[c] = o[c] ^ t[c];
    }
    t = array0_16Offset(a);
    n = n.concat(t);
    i++;
    r -= 16;
  }
  return n;
}

function encode0_16(array0_16: number[]): number[] {
  const result: number[] = [];
  const arrayOffset = [48, 53, 57, 48, 53, 51, 102, 55, 100, 49, 53, 101, 48, 49, 100, 55];
  for (let i = 0; i < array0_16.length; i++) {
    const a = array0_16[i] ^ arrayOffset[i];
    const b = a ^ 42;
    result.push(b);
  }
  return array0_16Offset(result);
}

function encode(ar: number[]): number[] {
  let b = ar[1] << 8;
  let c = ar[0] | b;
  let d = ar[2] << 16;
  let e = c | d;
  const resultArray: number[] = [];
  let x6 = 6;
  resultArray.push(e & 63);
  while (resultArray.length < 4) {
    const a = e >>> x6;
    resultArray.push(a & 63);
    x6 += 6;
  }
  return resultArray;
}

function getInitArray(encodeMd5: string): number[] {
  const initArray: number[] = [];
  for (let i = 0; i < encodeMd5.length; i++) {
    initArray.push(encodeMd5.charCodeAt(i));
  }
  initArray.unshift(0);
  initArray.unshift(Math.floor(Math.random() * 127));
  while (initArray.length < 48) {
    initArray.push(14);
  }
  const a0_16 = encode0_16(initArray.slice(0, 16));
  const a16_48 = array16_48Offset(initArray.slice(16, 48), a0_16);
  return a0_16.concat(a16_48);
}

function getZse96(encodeMd5: string): string {
  let resultArray: number[] = [];
  const initArray = getInitArray(encodeMd5);
  let result = "";
  for (let i = 47; i >= 0; i -= 4) {
    initArray[i] ^= 58;
  }
  initArray.reverse();
  for (let j = 3; j <= initArray.length; j += 3) {
    const ar = initArray.slice(j - 3, j);
    resultArray = resultArray.concat(encode(ar));
  }
  for (let index = 0; index < resultArray.length; index++) {
    result += INIT_STR.charAt(resultArray[index]);
  }
  result = "2.0_" + result;
  return result;
}

function extractDc0ValueFromCookies(cookies: string): string {
  const regex = /d_c0=([^;]+)/;
  const match = regex.exec(cookies);
  if (!match) {
    return "";
  }
  let val = match[1].trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.substring(1, val.length - 1);
  }
  return val;
}

/**
 * # Sinh chữ ký x-zse-96 và x-zst-81 cho request API Zhihu
 */
export function getZhihuSign(
  url: string,
  cookies: string
): { "x-zst-81": string; "x-zse-96": string } {
  const ta = "101_3_3.0";
  const dc0 = extractDc0ValueFromCookies(cookies);
  const tc = "3_2.0aR_sn77yn6O92wOB8hPZnQr0EMYxc4f18wNBUgpTQ6nxERFZfTY0-4Lm-h3_tufIwJS8gcxTgJS_AuPZNcXCTwxI78YxEM20s4PGDwN8gGcYAupMWufIoLVqr4gxrRPOI0cY7HL8qun9g93mFukyigcmebS_FwOYPRP0E4rZUrN9DDom3hnynAUMnAVPF_PhaueTFH9fQL39OCCqYTxfb0rfi9wfPhSM6vxGDJo_rBHpQGNmBBLqPJHK2_w8C9eTVMO9Z9NOrMtfhGH_DgpM-BNM1DOxScLG3gg1Hre1FCXKQcXKkrSL1r9GWDXMk8wqBLNmbRH96BtOFqVZ7UYG3gC8D9cMS7Y9UrHLVCLZPJO8_CL_6GNCOg_zhJS8PbXmGTcBpgxfkieOPhNfthtf2gC_qD3YOce8nCwG2uwBOqeMoML9NBC1xb9yk6SuJhHLK7SM6LVfCve_3vLKlqcL6TxL_UosDvHLxrHmWgxBQ8Xs";
  const paramsJoinStr = [ta, url, dc0, tc].join("+");
  const paramsMd5Value = crypto.createHash("md5").update(paramsJoinStr).digest("hex");

  return {
    "x-zst-81": tc,
    "x-zse-96": getZse96(paramsMd5Value),
  };
}
