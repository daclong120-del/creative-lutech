import {
  redactUrl as redactUrlNew,
  getClientHintsHeaders as getClientHintsHeadersNew,
  getWebId as getWebIdNew,
  buildCommonParams,
  douyinGet as douyinGetNew,
  downloadMedia as downloadMediaNew,
  sleep as sleepNew,
  CRAWL_SLEEP_MS as CRAWL_SLEEP_MS_NEW,
} from "./http_client.js";
import { createSessionFromRaw, DouyinSession } from "./session.js";
import { getSelfProfile } from "./api.js";

export const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const CRAWL_SLEEP_MS = CRAWL_SLEEP_MS_NEW;
export const sleep = sleepNew;

let activeSession: DouyinSession | null = null;

export function redactUrl(url: string): string {
  return redactUrlNew(url);
}

export function setDouyinSession(cookiesOrSession: any, msToken: string = ""): void {
  if (cookiesOrSession === null) {
    activeSession = null;
  } else {
    activeSession = createSessionFromRaw({
      cookies: Array.isArray(cookiesOrSession) ? cookiesOrSession : cookiesOrSession.cookies || [],
      msToken: cookiesOrSession.msToken || msToken,
      userAgent: cookiesOrSession.userAgent || DEFAULT_USER_AGENT,
      webid: cookiesOrSession.webid,
      verifyFp: cookiesOrSession.verifyFp,
      fp: cookiesOrSession.fp,
      uifid: cookiesOrSession.uifid,
      xmst: cookiesOrSession.xmst,
    }, "legacy");
  }
}

export async function getEffectiveSession(): Promise<DouyinSession | null> {
  if (activeSession) return activeSession;
  const { loadSession } = await import("../../sign/session_store.js");
  const local = await loadSession();
  if (local) {
    return createSessionFromRaw(local, "local");
  }
  return null;
}

export function getActiveUserAgent(): string {
  return activeSession?.userAgent || DEFAULT_USER_AGENT;
}

export function getClientHintsHeaders(ua: string): Record<string, string> {
  return getClientHintsHeadersNew(ua);
}

export async function incrementPageLoad(): Promise<void> {}

export async function douyinRequest(url: string, options: any = {}): Promise<any> {
  const session = await getEffectiveSession();
  if (!session) throw new Error("No session available");
  const { requestJson } = await import("./http_client.js");
  return requestJson(url, session, options);
}

export function getWebId(): string {
  return getWebIdNew();
}

export function getCommonParams(session: DouyinSession): Record<string, string> {
  return buildCommonParams(session);
}

export async function douyinGet(
  uri: string,
  extraParams: Record<string, string>,
  opts: { sign?: boolean; referer?: string } = {}
): Promise<any> {
  const session = await getEffectiveSession();
  if (!session) throw new Error("No session available");
  return douyinGetNew(uri, extraParams, session, opts);
}

export async function downloadMedia(url: string): Promise<Buffer> {
  return downloadMediaNew(url);
}

export async function checkSessionAlive(): Promise<boolean> {
  try {
    const session = await getEffectiveSession();
    if (!session) return false;
    const res = await getSelfProfile(session);
    return !!(res && res.user && res.user.nickname);
  } catch {
    return false;
  }
}
