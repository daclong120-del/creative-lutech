/**
 * # Kiểu dữ liệu proxy và provider
 */

export interface ProxyInfo {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: "http" | "https" | "socks5";
}

export interface ProxyProvider {
  name: string;
  getProxy(): Promise<ProxyInfo | null>;
  reportBad(proxy: ProxyInfo): void;
}

/**
 * # Chuyển ProxyInfo thành URL string
 */
export function proxyToUrl(proxy: ProxyInfo): string {
  const auth = proxy.username && proxy.password
    ? `${proxy.username}:${proxy.password}@`
    : "";
  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
}
