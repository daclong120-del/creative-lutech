import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface SessionData {
  cookies: any[];
  msToken: string;
  userAgent?: string;
  webid?: string;
  verifyFp?: string;
  fp?: string;
  uifid?: string;
  xmst?: string;
  updatedAt: string;
}

const SESSION_FILE = join(process.cwd(), "output", "session.json");

/**
 * # Lưu thông tin session hoạt động
 */
export async function saveSession(data: {
  cookies: any[];
  msToken: string;
  userAgent?: string;
  webid?: string;
  verifyFp?: string;
  fp?: string;
  uifid?: string;
  xmst?: string;
}) {
  const payload: SessionData = {
    cookies: data.cookies,
    msToken: data.msToken,
    userAgent: data.userAgent,
    webid: data.webid,
    verifyFp: data.verifyFp,
    fp: data.fp,
    uifid: data.uifid,
    xmst: data.xmst,
    updatedAt: new Date().toISOString(),
  };

  await mkdir(join(process.cwd(), "output"), { recursive: true });
  await writeFile(SESSION_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/**
 * # Đọc session đã lưu để thực hiện cào trực tiếp qua HTTP
 */
export async function loadSession(): Promise<SessionData | null> {
  try {
    const raw = await readFile(SESSION_FILE, "utf8");
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}
