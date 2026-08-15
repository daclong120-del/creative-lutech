/**
 * # Cache interface trừu tượng cho hệ thống crawler
 * Ánh xạ từ ChinaMediaCrawler cache/abs_cache.py → TypeScript interface
 * Dùng in-memory cache thay vì Redis (Supabase unique constraint xử lý dedup chính)
 */

export interface ICache {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown, ttlSeconds: number): void;
  has(key: string): boolean;
  keys(pattern?: string): string[];
  delete(key: string): boolean;
  clear(): void;
}

/**
 * # In-memory cache có TTL tự động dọn dẹp
 * Thay thế cả RedisCache + ExpiringLocalCache của ChinaMediaCrawler
 * Đủ dùng cho VPS single-process, không cần dependency Redis
 */
export class MemoryCache implements ICache {
  private _store = new Map<string, { value: unknown; expiresAt: number }>();
  private _timer: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs = 30_000) {
    this._timer = setInterval(() => this._cleanup(), cleanupIntervalMs);
    if (this._timer.unref) {
      this._timer.unref();
    }
  }

  get(key: string): unknown | undefined {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: unknown, ttlSeconds: number): void {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  keys(pattern?: string): string[] {
    this._cleanup();
    const allKeys = [...this._store.keys()];
    if (!pattern || pattern === "*") return allKeys;
    const search = pattern.replace(/\*/g, "");
    return allKeys.filter((k) => k.includes(search));
  }

  delete(key: string): boolean {
    return this._store.delete(key);
  }

  clear(): void {
    this._store.clear();
  }

  destroy(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._store.clear();
  }

  private _cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt) {
        this._store.delete(key);
      }
    }
  }
}

/**
 * # Singleton cache instance dùng chung cho toàn bộ crawler pipeline
 */
let _globalCache: MemoryCache | null = null;

export function getCache(): MemoryCache {
  if (!_globalCache) {
    _globalCache = new MemoryCache();
  }
  return _globalCache;
}
