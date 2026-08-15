import { createHash, randomBytes, randomInt } from "node:crypto";

export interface XhsSignInput {
  method: string;
  uri: string;
  data?: Record<string, any>;
  cookie: string;
}

export interface XhsSignHeaders {
  "X-S": string;
  "X-T": string;
  "x-S-Common": string;
  "X-B3-Traceid": string;
  "X-Xray-Traceid"?: string;
}

const STANDARD_BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const CUSTOM_BASE64_ALPHABET = "ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5";
const X3_BASE64_ALPHABET = "MfgqrsbcyzPQRStuvC7mn501HIJBo2DEFTKdeNOwxWXYZap89+/A4UVLhijkl63G";
const HEX_KEY =
  "71a302257793271ddd273bcee3e4b98d9d7935e1da33f5765e2ea8afb6dc77a51a499d23b67c20660025860cbf13d4540d92497f58686c574e508f46e1956344f39139bf4faf22a3eef120b79258145b2feb5193b6478669961298e79bedca646e1a693a926154a5a7a1bd1cf0dedb742f917a747a1e388b234f2277516db7116035439730fa61e9822a0eca7bff72d8";
const VERSION_BYTES = [121, 104, 96, 41];
const ENV_TABLE = [115, 248, 83, 102, 103, 201, 181, 131, 99, 94, 4, 68, 250, 132, 21];
const ENV_CHECKS_DEFAULT = [0, 1, 18, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0];
const HASH_IV = [1831565813, 461845907, 2246822507, 3266489909];
const A3_PREFIX = [2, 97, 51, 16];
const X3_PREFIX = "mns0301_";
const XYS_PREFIX = "XYS_";
const APP_ID = "xhs-pc-web";
const B1_SECRET_KEY = "xhswebmplfbt";
const HEX_CHARS = "abcdef0123456789";

const CRC32_TABLE = (() => {
  const table = new Array<number>(256);
  for (let d = 0; d < 256; d++) {
    let r = d;
    for (let i = 0; i < 8; i++) {
      r = r & 1 ? (r >>> 1) ^ 0xedb88320 : r >>> 1;
    }
    table[d] = r >>> 0;
  }
  return table;
})();

function parseCookies(cookie: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) {
      result[key] = value;
    }
  }
  return result;
}

function md5Hex(value: string): string {
  return createHash("md5").update(value, "utf8").digest("hex");
}

function md5Bytes(value: string): number[] {
  return Array.from(createHash("md5").update(value, "utf8").digest());
}

function toLittleEndianBytes(value: number | bigint, length: number): number[] {
  let n = BigInt(value);
  const bytes: number[] = [];
  for (let i = 0; i < length; i++) {
    bytes.push(Number(n & 0xffn));
    n >>= 8n;
  }
  return bytes;
}

function rotateLeft32(value: number, bits: number): number {
  return (((value << bits) | (value >>> (32 - bits))) >>> 0);
}

function customHashV2(inputBytes: number[]): number[] {
  let [s0, s1, s2, s3] = HASH_IV.map((v) => v >>> 0);
  const length = inputBytes.length;

  s0 = (s0 ^ length) >>> 0;
  s1 = (s1 ^ (length << 8)) >>> 0;
  s2 = (s2 ^ (length << 16)) >>> 0;
  s3 = (s3 ^ (length << 24)) >>> 0;

  for (let i = 0; i < Math.floor(length / 8); i++) {
    const offset = i * 8;
    const v0 =
      (inputBytes[offset] |
        (inputBytes[offset + 1] << 8) |
        (inputBytes[offset + 2] << 16) |
        (inputBytes[offset + 3] << 24)) >>>
      0;
    const v1 =
      (inputBytes[offset + 4] |
        (inputBytes[offset + 5] << 8) |
        (inputBytes[offset + 6] << 16) |
        (inputBytes[offset + 7] << 24)) >>>
      0;

    s0 = rotateLeft32((((s0 + v0) >>> 0) ^ s2) >>> 0, 7);
    s1 = rotateLeft32((((v0 ^ s1) >>> 0) + s3) >>> 0, 11);
    s2 = rotateLeft32((((s2 + v1) >>> 0) ^ s0) >>> 0, 13);
    s3 = rotateLeft32((((s3 ^ v1) >>> 0) + s1) >>> 0, 17);
  }

  const t0 = (s0 ^ length) >>> 0;
  const t1 = (s1 ^ t0) >>> 0;
  const t2 = (s2 + t1) >>> 0;
  const t3 = (s3 ^ t2) >>> 0;

  s0 = (rotateLeft32(t0, 9) + rotateLeft32(t2, 17)) >>> 0;
  s1 = (rotateLeft32(t1, 13) ^ rotateLeft32(t3, 19)) >>> 0;
  s2 = (rotateLeft32(t2, 17) + s0) >>> 0;
  s3 = (rotateLeft32(t3, 19) ^ s1) >>> 0;

  return [s0, s1, s2, s3].flatMap((value) => toLittleEndianBytes(value, 4));
}

function translateBase64(value: string, alphabet: string): string {
  let result = "";
  for (const char of value) {
    const index = STANDARD_BASE64_ALPHABET.indexOf(char);
    result += index === -1 ? char : alphabet[index];
  }
  return result;
}

function customBase64(data: string | number[] | Uint8Array, alphabet = CUSTOM_BASE64_ALPHABET): string {
  const buffer =
    typeof data === "string"
      ? Buffer.from(data, "utf8")
      : Buffer.from(Array.from(data).map((value) => value & 0xff));
  return translateBase64(buffer.toString("base64"), alphabet);
}

function encodeGetValue(value: unknown): string {
  if (Array.isArray(value)) {
    return encodeURIComponent(value.map((item) => String(item)).join(",")).replace(/%2C/g, ",");
  }
  if (value === null || value === undefined) {
    return "";
  }
  return encodeURIComponent(String(value)).replace(/%2C/g, ",");
}

function buildContentString(method: string, uri: string, data?: Record<string, any>): string {
  if (method.toUpperCase() === "POST") {
    return `${uri}${JSON.stringify(data || {})}`;
  }

  if (!data || Object.keys(data).length === 0) {
    return uri;
  }

  const params = Object.entries(data).map(([key, value]) => `${key}=${encodeGetValue(value)}`);
  return `${uri}?${params.join("&")}`;
}

function extractApiPath(contentString: string): string {
  const bracePos = contentString.indexOf("{");
  const questionPos = contentString.indexOf("?");
  const cuts = [bracePos, questionPos].filter((pos) => pos !== -1);
  return cuts.length > 0 ? contentString.slice(0, Math.min(...cuts)) : contentString;
}

function xorTransformArray(source: number[]): number[] {
  const key = Buffer.from(HEX_KEY, "hex");
  return source.map((value, index) => (value ^ (key[index] ?? 0)) & 0xff);
}

function buildPayload(hexParameter: string, a1Value: string, contentString: string, timestampMs: number): number[] {
  const seed = randomBytes(4).readUInt32LE(0);
  const seedByte = seed & 0xff;
  const payload: number[] = [];

  payload.push(...VERSION_BYTES);
  payload.push(...toLittleEndianBytes(seed, 4));

  const tsBytes = toLittleEndianBytes(BigInt(timestampMs), 8);
  payload.push(...tsBytes);

  const timeOffset = randomInt(10, 51);
  payload.push(...toLittleEndianBytes(BigInt(timestampMs - timeOffset * 1000), 8));
  payload.push(...toLittleEndianBytes(randomInt(15, 51), 4));
  payload.push(...toLittleEndianBytes(randomInt(1000, 1201), 4));
  payload.push(...toLittleEndianBytes(Buffer.byteLength(contentString, "utf8"), 4));

  const md5PayloadBytes = Array.from(Buffer.from(hexParameter, "hex"));
  for (let i = 0; i < 8; i++) {
    payload.push((md5PayloadBytes[i] ^ seedByte) & 0xff);
  }

  const a1Bytes = Array.from(Buffer.from(a1Value, "utf8")).slice(0, 52);
  while (a1Bytes.length < 52) a1Bytes.push(0);
  payload.push(a1Bytes.length);
  payload.push(...a1Bytes);

  const appBytes = Array.from(Buffer.from(APP_ID, "utf8")).slice(0, 10);
  while (appBytes.length < 10) appBytes.push(0);
  payload.push(appBytes.length);
  payload.push(...appBytes);

  const envPart = [1, seedByte ^ ENV_TABLE[0]];
  for (let i = 1; i < 15; i++) {
    envPart.push(ENV_TABLE[i] ^ ENV_CHECKS_DEFAULT[i]);
  }
  payload.push(...envPart);

  const a3Input = contentString.includes("{") ? extractApiPath(contentString) : contentString;
  const pathDigest = md5Bytes(a3Input);
  const a3Hash = customHashV2([...tsBytes, ...pathDigest]).map((byte) => byte ^ seedByte);
  payload.push(...A3_PREFIX, ...a3Hash);

  return payload;
}

function signXS(method: string, uri: string, data: Record<string, any> | undefined, a1Value: string, timestampMs: number): string {
  const contentString = buildContentString(method, uri, data);
  const dValue = md5Hex(contentString);
  const payload = buildPayload(dValue, a1Value, contentString, timestampMs);
  const x3Signature = customBase64(xorTransformArray(payload).slice(0, 144), X3_BASE64_ALPHABET);
  const signatureData = {
    x0: "4.2.6",
    x1: APP_ID,
    x2: "Windows",
    x3: `${X3_PREFIX}${x3Signature}`,
    x4: "",
  };
  return `${XYS_PREFIX}${customBase64(JSON.stringify(signatureData))}`;
}

function rc4Encrypt(data: Uint8Array, key: Uint8Array): number[] {
  const s = Array.from({ length: 256 }, (_, index) => index);
  let j = 0;

  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }

  const result: number[] = [];
  let i = 0;
  j = 0;
  for (const byte of data) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    const k = s[(s[i] + s[j]) & 0xff];
    result.push(byte ^ k);
  }

  return result;
}

function quoteLatin1Bytes(bytes: number[]): string {
  let result = "";
  for (const byte of bytes) {
    const ch = String.fromCharCode(byte);
    if (/^[A-Za-z0-9_.!~*'()-]$/.test(ch)) {
      result += ch;
      continue;
    }
    if (byte < 0x80) {
      result += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
      continue;
    }
    result += encodeURIComponent(ch);
  }
  return result;
}

function buildB1BytesFromQuoted(quoted: string): number[] {
  const result: number[] = [];
  for (const chunk of quoted.split("%").slice(1)) {
    result.push(parseInt(chunk.slice(0, 2), 16));
    for (const ch of chunk.slice(2)) {
      result.push(ch.charCodeAt(0));
    }
  }
  return result;
}

function generateB1(): string {
  const nowMs = Date.now();
  const fp = {
    x33: "0",
    x34: "0",
    x35: "0",
    x36: String(randomInt(1, 21)),
    x37: "0|0|0|0|0|0|0|0|0|1|0|0|0|0|0|0|0|0|1|0|0|0|0|0",
    x38: "0|0|1|0|1|0|0|0|0|0|1|0|1|0|1|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0",
    x39: 0,
    x42: "3.4.4",
    x43: md5Hex(randomBytes(16).toString("hex")).slice(0, 8),
    x44: String(nowMs),
    x45: "__SEC_CAV__1-1-1-1-1|__SEC_WSA__|",
    x46: "false",
    x48: "",
    x49: "{list:[],type:}",
    x50: "",
    x51: "",
    x52: "",
    x82: "_0x17a2|_0x1954",
  };

  const json = JSON.stringify(fp);
  const encrypted = rc4Encrypt(Buffer.from(json, "utf8"), Buffer.from(B1_SECRET_KEY, "utf8"));
  return customBase64(buildB1BytesFromQuoted(quoteLatin1Bytes(encrypted)));
}

function crc32JsInt(value: string): number {
  let c = 0xffffffff;
  for (const ch of value) {
    const byte = ch.charCodeAt(0) & 0xff;
    c = (CRC32_TABLE[((c & 0xff) ^ byte) & 0xff] ^ (c >>> 8)) >>> 0;
  }
  const unsigned = ((0xffffffff ^ c) ^ 0xedb88320) >>> 0;
  return unsigned & 0x80000000 ? unsigned - 0x100000000 : unsigned;
}

function signXSCommon(a1Value: string): string {
  const b1 = generateB1();
  const common = {
    s0: 5,
    s1: "",
    x0: "1",
    x1: "4.2.6",
    x2: "Windows",
    x3: APP_ID,
    x4: "4.86.0",
    x5: a1Value,
    x6: "",
    x7: "",
    x8: b1,
    x9: crc32JsInt(b1),
    x10: 0,
    x11: "normal",
  };
  return customBase64(JSON.stringify(common));
}

function getB3TraceId(): string {
  let value = "";
  for (let i = 0; i < 16; i++) {
    value += HEX_CHARS[randomInt(0, HEX_CHARS.length)];
  }
  return value;
}

function getXrayTraceId(timestampMs: number): string {
  const seq = BigInt(randomInt(0, 8_388_608));
  const part1 = ((BigInt(timestampMs) << 23n) | seq).toString(16).padStart(16, "0");
  let part2 = "";
  for (let i = 0; i < 16; i++) {
    part2 += HEX_CHARS[randomInt(0, HEX_CHARS.length)];
  }
  return `${part1}${part2}`;
}

export async function signXhsRequest(input: XhsSignInput): Promise<XhsSignHeaders> {
  const cookies = parseCookies(input.cookie);
  const a1Value = cookies.a1;
  if (!a1Value) {
    throw new Error("XHS signer requires a1 cookie");
  }

  const timestampMs = Date.now();
  return {
    "X-S": signXS(input.method, input.uri, input.data, a1Value, timestampMs),
    "X-T": String(timestampMs),
    "x-S-Common": signXSCommon(a1Value),
    "X-B3-Traceid": getB3TraceId(),
    "X-Xray-Traceid": getXrayTraceId(timestampMs),
  };
}
