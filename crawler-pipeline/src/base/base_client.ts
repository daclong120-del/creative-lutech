/**
 * # Giao diện trừu tượng cho API client của mỗi platform
 * Xử lý HTTP request, quản lý cookie/session
 */
export interface IApiClient {
  request(method: string, url: string, options?: RequestOptions): Promise<any>;
  updateCookies(cookies: CookieData[]): Promise<void>;
  getActiveCookies(): CookieData[];
}

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  sign?: boolean;
  referer?: string;
  allowBrowserFallback?: boolean;
}

export interface CookieData {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}
