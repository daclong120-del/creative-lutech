/**
 * # Thuật toán sinh chữ ký a_bogus cho Douyin API
 * Viết lại từ douyin.js (reverse-engineered) sang TypeScript thuần
 * Bao gồm: SM3 hash, RC4 encrypt, base64 biến thể, a_bogus generator
 */

import crypto from "node:crypto";

function rc4Encrypt(plaintext: string, key: string): string {
  const s: number[] = [];
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }

  let ii = 0;
  let jj = 0;
  const cipher: string[] = [];
  for (let k = 0; k < plaintext.length; k++) {
    ii = (ii + 1) % 256;
    jj = (jj + s[ii]) % 256;
    const temp = s[ii];
    s[ii] = s[jj];
    s[jj] = temp;
    const t = (s[ii] + s[jj]) % 256;
    cipher.push(String.fromCharCode(s[t] ^ plaintext.charCodeAt(k)));
  }
  return cipher.join("");
}

function le(e: number, r: number): number {
  return (e << (r %= 32) | e >>> 32 - r) >>> 0;
}

function de(e: number): number {
  if (0 <= e && e < 16) return 2043430169;
  if (16 <= e && e < 64) return 2055708042;
  return 0;
}

function pe(e: number, r: number, t: number, n: number): number {
  if (0 <= e && e < 16) return (r ^ t ^ n) >>> 0;
  if (16 <= e && e < 64) return (r & t | r & n | t & n) >>> 0;
  return 0;
}

function he(e: number, r: number, t: number, n: number): number {
  if (0 <= e && e < 16) return (r ^ t ^ n) >>> 0;
  if (16 <= e && e < 64) return (r & t | ~r & n) >>> 0;
  return 0;
}

function se(str: string, len: number, pad: string): string {
  while (str.length < len) {
    str = pad + str;
  }
  return str;
}

class SM3 {
  reg: number[] = [];
  chunk: number[] = [];
  size: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.reg[0] = 1937774191;
    this.reg[1] = 1226093241;
    this.reg[2] = 388252375;
    this.reg[3] = 3666478592;
    this.reg[4] = 2842636476;
    this.reg[5] = 372324522;
    this.reg[6] = 3817729613;
    this.reg[7] = 2969243214;
    this.chunk = [];
    this.size = 0;
  }

  write(e: string | number[]): void {
    const a: number[] = typeof e === "string"
      ? (() => {
          const n = encodeURIComponent(e).replace(/%([0-9A-F]{2})/g, (_match: string, r: string) =>
            String.fromCharCode(parseInt("0x" + r, 16))
          );
          const arr = new Array(n.length);
          Array.prototype.forEach.call(n, (char: string, idx: number) => {
            arr[idx] = char.charCodeAt(0);
          });
          return arr;
        })()
      : e;

    this.size += a.length;
    let f = 64 - this.chunk.length;
    if (a.length < f) {
      this.chunk = this.chunk.concat(a);
    } else {
      this.chunk = this.chunk.concat(a.slice(0, f));
      while (this.chunk.length >= 64) {
        this._compress(this.chunk);
        if (f < a.length) {
          this.chunk = a.slice(f, Math.min(f + 64, a.length));
          f += 64;
        } else {
          this.chunk = [];
        }
      }
    }
  }

  sum(e?: string | number[], t?: string): number[] | string {
    if (e !== undefined) {
      this.reset();
      this.write(e);
    }
    this._fill();

    for (let f = 0; f < this.chunk.length; f += 64) {
      this._compress(this.chunk.slice(f, f + 64));
    }

    let result: number[] | string;
    if (t === "hex") {
      result = "";
      for (let f = 0; f < 8; f++) {
        result += se(this.reg[f].toString(16), 8, "0");
      }
    } else {
      const arr = new Array(32);
      for (let f = 0; f < 8; f++) {
        let c = this.reg[f];
        arr[4 * f + 3] = (255 & c) >>> 0;
        c >>>= 8;
        arr[4 * f + 2] = (255 & c) >>> 0;
        c >>>= 8;
        arr[4 * f + 1] = (255 & c) >>> 0;
        c >>>= 8;
        arr[4 * f] = (255 & c) >>> 0;
      }
      result = arr;
    }
    this.reset();
    return result;
  }

  _compress(t: number[]): void {
    if (t.length < 64) {
      return;
    }

    const expandedW: number[] = new Array(132);
    for (let idx = 0; idx < 16; idx++) {
      expandedW[idx] = t[4 * idx] << 24;
      expandedW[idx] |= t[4 * idx + 1] << 16;
      expandedW[idx] |= t[4 * idx + 2] << 8;
      expandedW[idx] |= t[4 * idx + 3];
      expandedW[idx] >>>= 0;
    }
    for (let n = 16; n < 68; n++) {
      let a = expandedW[n - 16] ^ expandedW[n - 9] ^ le(expandedW[n - 3], 15);
      a = a ^ le(a, 15) ^ le(a, 23);
      expandedW[n] = (a ^ le(expandedW[n - 13], 7) ^ expandedW[n - 6]) >>> 0;
    }
    for (let n = 0; n < 64; n++) {
      expandedW[n + 68] = (expandedW[n] ^ expandedW[n + 4]) >>> 0;
    }

    const i = this.reg.slice(0);
    for (let c = 0; c < 64; c++) {
      let o = le(i[0], 12) + i[4] + le(de(c), c);
      o = (4294967295 & o) >>> 0;
      const s = (le(o, 7) ^ le(i[0], 12)) >>> 0;
      let u = pe(c, i[0], i[1], i[2]);
      u = (4294967295 & (u + i[3] + s + expandedW[c + 68])) >>> 0;
      let b = he(c, i[4], i[5], i[6]);
      b = (4294967295 & (b + i[7] + le(o, 7) + expandedW[c])) >>> 0;
      i[3] = i[2];
      i[2] = le(i[1], 9);
      i[1] = i[0];
      i[0] = u;
      i[7] = i[6];
      i[6] = le(i[5], 19);
      i[5] = i[4];
      i[4] = (b ^ le(b, 9) ^ le(b, 17)) >>> 0;
    }
    for (let l = 0; l < 8; l++) {
      this.reg[l] = (this.reg[l] ^ i[l]) >>> 0;
    }
  }

  _fill(): void {
    const a = 8 * this.size;
    let f = this.chunk.push(128) % 64;
    if (64 - f < 8) {
      f -= 64;
    }
    while (f < 56) {
      this.chunk.push(0);
      f++;
    }
    for (let i = 0; i < 4; i++) {
      const c = Math.floor(a / 4294967296);
      this.chunk.push(c >>> 8 * (3 - i) & 255);
    }
    for (let i = 0; i < 4; i++) {
      this.chunk.push(a >>> 8 * (3 - i) & 255);
    }
  }
}

const S_OBJ: Record<string, string> = {
  s0: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  s1: "Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",
  s2: "Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",
  s3: "ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe",
  s4: "Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe",
};

function getLongInt(round: number, longStr: string): number {
  round = round * 3;
  return (longStr.charCodeAt(round) << 16) | (longStr.charCodeAt(round + 1) << 8) | longStr.charCodeAt(round + 2);
}

function resultEncrypt(longStr: string, num: string): string {
  const charSet = S_OBJ[num];
  const constant: Record<string, number | string> = {
    "0": 16515072,
    "1": 258048,
    "2": 4032,
  };

  let result = "";
  let lound = 0;
  let longInt = getLongInt(lound, longStr);
  for (let i = 0; i < longStr.length / 3 * 4; i++) {
    if (Math.floor(i / 4) !== lound) {
      lound += 1;
      longInt = getLongInt(lound, longStr);
    }
    const key = i % 4;
    let tempInt: number;
    switch (key) {
      case 0:
        tempInt = (longInt & (constant["0"] as number)) >> 18;
        result += charSet.charAt(tempInt);
        break;
      case 1:
        tempInt = (longInt & (constant["1"] as number)) >> 12;
        result += charSet.charAt(tempInt);
        break;
      case 2:
        tempInt = (longInt & (constant["2"] as number)) >> 6;
        result += charSet.charAt(tempInt);
        break;
      case 3:
        tempInt = longInt & 63;
        result += charSet.charAt(tempInt);
        break;
    }
  }
  return result;
}

function generRandom(random: number, option: number[]): number[] {
  return [
    (random & 255 & 170) | option[0] & 85,
    (random & 255 & 85) | option[0] & 170,
    (random >> 8 & 255 & 170) | option[1] & 85,
    (random >> 8 & 255 & 85) | option[1] & 170,
  ];
}

function generateRc4BbStr(
  urlSearchParams: string,
  userAgent: string,
  windowEnvStr: string,
  suffix: string = "cus",
  args: number[] = [0, 1, 14]
): string {
  const sm3 = new SM3();
  const startTime = Date.now();

  const urlSearchParamsList = sm3.sum(sm3.sum(urlSearchParams + suffix) as number[]) as number[];
  const cus = sm3.sum(sm3.sum(suffix) as number[]) as number[];
  const ua = sm3.sum(
    resultEncrypt(
      rc4Encrypt(userAgent, String.fromCharCode(0.00390625, 1, args[2])),
      "s3"
    )
  ) as number[];

  const endTime = Date.now();

  const b: Record<number, any> = {};
  b[8] = 3;
  b[10] = endTime;
  b[15] = {
    aid: 6383,
    pageId: 6241,
    boe: false,
    ddrt: 7,
    paths: {
      include: [{}, {}, {}, {}, {}, {}, {}],
      exclude: [],
    },
    track: {
      mode: 0,
      delay: 300,
      paths: [],
    },
    dump: true,
    rpU: "",
  };
  b[16] = startTime;
  b[18] = 44;
  b[19] = [1, 0, 1, 5];

  b[20] = (b[16] >> 24) & 255;
  b[21] = (b[16] >> 16) & 255;
  b[22] = (b[16] >> 8) & 255;
  b[23] = b[16] & 255;
  b[24] = (b[16] / 256 / 256 / 256 / 256) >> 0;
  b[25] = (b[16] / 256 / 256 / 256 / 256 / 256) >> 0;

  b[26] = (args[0] >> 24) & 255;
  b[27] = (args[0] >> 16) & 255;
  b[28] = (args[0] >> 8) & 255;
  b[29] = args[0] & 255;

  b[30] = (args[1] / 256) & 255;
  b[31] = (args[1] % 256) & 255;
  b[32] = (args[1] >> 24) & 255;
  b[33] = (args[1] >> 16) & 255;

  b[34] = (args[2] >> 24) & 255;
  b[35] = (args[2] >> 16) & 255;
  b[36] = (args[2] >> 8) & 255;
  b[37] = args[2] & 255;

  b[38] = urlSearchParamsList[21];
  b[39] = urlSearchParamsList[22];

  b[40] = cus[21];
  b[41] = cus[22];

  b[42] = ua[23];
  b[43] = ua[24];

  b[44] = (b[10] >> 24) & 255;
  b[45] = (b[10] >> 16) & 255;
  b[46] = (b[10] >> 8) & 255;
  b[47] = b[10] & 255;
  b[48] = b[8];
  b[49] = (b[10] / 256 / 256 / 256 / 256) >> 0;
  b[50] = (b[10] / 256 / 256 / 256 / 256 / 256) >> 0;

  b[51] = b[15].pageId;
  b[52] = (b[15].pageId >> 24) & 255;
  b[53] = (b[15].pageId >> 16) & 255;
  b[54] = (b[15].pageId >> 8) & 255;
  b[55] = b[15].pageId & 255;

  b[56] = b[15].aid;
  b[57] = b[15].aid & 255;
  b[58] = (b[15].aid >> 8) & 255;
  b[59] = (b[15].aid >> 16) & 255;
  b[60] = (b[15].aid >> 24) & 255;

  const windowEnvList: number[] = [];
  for (let index = 0; index < windowEnvStr.length; index++) {
    windowEnvList.push(windowEnvStr.charCodeAt(index));
  }
  b[64] = windowEnvList.length;
  b[65] = b[64] & 255;
  b[66] = (b[64] >> 8) & 255;

  b[69] = 0;
  b[70] = b[69] & 255;
  b[71] = (b[69] >> 8) & 255;

  b[72] = b[18] ^ b[20] ^ b[26] ^ b[30] ^ b[38] ^ b[40] ^ b[42] ^ b[21] ^ b[27] ^ b[31] ^ b[35] ^ b[39] ^ b[41] ^ b[43] ^ b[22] ^
    b[28] ^ b[32] ^ b[36] ^ b[23] ^ b[29] ^ b[33] ^ b[37] ^ b[44] ^ b[45] ^ b[46] ^ b[47] ^ b[48] ^ b[49] ^ b[50] ^ b[24] ^
    b[25] ^ b[52] ^ b[53] ^ b[54] ^ b[55] ^ b[57] ^ b[58] ^ b[59] ^ b[60] ^ b[65] ^ b[66] ^ b[70] ^ b[71];

  let bb: number[] = [
    b[18], b[20], b[52], b[26], b[30], b[34], b[58], b[38], b[40], b[53], b[42], b[21], b[27], b[54], b[55], b[31],
    b[35], b[57], b[39], b[41], b[43], b[22], b[28], b[32], b[60], b[36], b[23], b[29], b[33], b[37], b[44], b[45],
    b[59], b[46], b[47], b[48], b[49], b[50], b[24], b[25], b[65], b[66], b[70], b[71],
  ];
  bb = bb.concat(windowEnvList).concat(b[72]);
  return rc4Encrypt(String.fromCharCode(...bb), String.fromCharCode(121));
}

function generateRandomStr(): string {
  const randomStrList: number[] = [];
  return String.fromCharCode(
    ...randomStrList
      .concat(generRandom(Math.random() * 10000, [3, 45]))
      .concat(generRandom(Math.random() * 10000, [1, 0]))
      .concat(generRandom(Math.random() * 10000, [1, 5]))
  );
}

function sign(urlSearchParams: string, userAgent: string, args: number[]): string {
  const resultStr = generateRandomStr() + generateRc4BbStr(
    urlSearchParams,
    userAgent,
    "1536|747|1536|834|0|30|0|0|1536|834|1536|864|1525|747|24|24|Win32",
    "cus",
    args
  );
  return resultEncrypt(resultStr, "s4") + "=";
}

/**
 * # Tính toán chữ ký a_bogus cho API xem chi tiết video Douyin
 */
export function signDetail(params: string, userAgent: string): string {
  return sign(params, userAgent, [0, 1, 14]);
}

/**
 * # Tính toán chữ ký a_bogus cho API xem bình luận Douyin
 */
export function signReply(params: string, userAgent: string): string {
  return sign(params, userAgent, [0, 1, 8]);
}
