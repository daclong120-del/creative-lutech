/**
 * # Quản lý pool proxy — xoay vòng, kiểm tra sức khỏe, loại bỏ proxy chết
 */

import type { ProxyInfo, ProxyProvider } from "./types.js";
import { proxyToUrl } from "./types.js";

export class ProxyPool {
  private providers: ProxyProvider[] = [];
  private activeProxies: ProxyInfo[] = [];
  private badProxies: Set<string> = new Set();
  private currentIndex = 0;

  /**
   * # Thêm một provider proxy vào pool
   */
  addProvider(provider: ProxyProvider): void {
    this.providers.push(provider);
  }

  /**
   * # Lấy proxy tiếp theo từ pool theo round-robin
   */
  async getProxy(): Promise<ProxyInfo | null> {
    if (this.activeProxies.length > 0) {
      const proxy = this.activeProxies[this.currentIndex % this.activeProxies.length];
      this.currentIndex++;
      const key = proxyToUrl(proxy);
      if (!this.badProxies.has(key)) {
        return proxy;
      }
    }

    for (const provider of this.providers) {
      const proxy = await provider.getProxy();
      if (proxy) {
        this.activeProxies.push(proxy);
        return proxy;
      }
    }

    return null;
  }

  /**
   * # Báo cáo proxy lỗi để loại khỏi vòng xoay
   */
  reportBad(proxy: ProxyInfo): void {
    const key = proxyToUrl(proxy);
    this.badProxies.add(key);
    for (const provider of this.providers) {
      provider.reportBad(proxy);
    }
  }

  /**
   * # Lấy số lượng proxy đang hoạt động
   */
  get activeCount(): number {
    return this.activeProxies.filter(p => !this.badProxies.has(proxyToUrl(p))).length;
  }
}
