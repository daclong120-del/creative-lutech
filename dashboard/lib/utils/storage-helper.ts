import { get, set, del } from "idb-keyval";

// Cache tạm lưu trên RAM để fallback khi IndexedDB không khả dụng (ví dụ Safari Private)
// Cache tạm lưu trên RAM để fallback khi IndexedDB không khả dụng (ví dụ Safari Private)
const inMemoryCache = new Map<string, unknown>();
let isIndexedDBAvailable: boolean | null = null;

/**
 * Kiểm tra xem IndexedDB có được trình duyệt hỗ trợ và cho phép ghi hay không.
 * Cache kết quả kiểm tra để tăng hiệu năng cho các lần gọi sau.
 */
async function checkIndexedDBAvailability(): Promise<boolean> {
  if (typeof window === "undefined") return false; // Tránh chạy ở Server-side SSR
  if (isIndexedDBAvailable !== null) return isIndexedDBAvailable;
  
  try {
    // Thử thực hiện chuỗi lệnh ghi, đọc và xóa giả định
    await set("sinomedia-db-availability-test", "ok");
    await get("sinomedia-db-availability-test");
    await del("sinomedia-db-availability-test");
    isIndexedDBAvailable = true;
  } catch (e) {
    console.warn("[Storage] IndexedDB is not available. Using in-memory fallback.", e);
    isIndexedDBAvailable = false;
  }
  return isIndexedDBAvailable;
}

/**
 * Lưu dữ liệu nháp dung lượng lớn bất đồng bộ.
 * 
 * @param key Khóa lưu trữ
 * @param value Dữ liệu cần lưu
 * @returns Object chứa trạng thái thành công và cờ báo fallback (nếu phải lưu trên RAM)
 */
export async function setLargeDraft(
  key: string,
  value: unknown
): Promise<{ success: boolean; isFallback: boolean }> {
  const isAvailable = await checkIndexedDBAvailability();
  
  if (isAvailable) {
    try {
      await set(key, value);
      return { success: true, isFallback: false };
    } catch (err) {
      console.error("[Storage] IndexedDB write error, falling back to memory:", err);
    }
  }
  
  // Ghi vào memory cache nếu IndexedDB bị chặn
  inMemoryCache.set(key, value);
  return { success: true, isFallback: true };
}

/**
 * Đọc dữ liệu nháp dung lượng lớn.
 * 
 * @param key Khóa lưu trữ
 * @returns Dữ liệu trả về hoặc null nếu không tồn tại
 */
export async function getLargeDraft<T>(key: string): Promise<T | null> {
  const isAvailable = await checkIndexedDBAvailability();
  
  if (isAvailable) {
    try {
      const data = await get(key);
      return (data as T) || null;
    } catch (err) {
      console.error("[Storage] IndexedDB read error, reading from memory fallback:", err);
    }
  }
  
  return (inMemoryCache.get(key) as T) || null;
}

/**
 * Xóa dữ liệu nháp khỏi bộ nhớ.
 * 
 * @param key Khóa lưu trữ
 * @returns Trạng thái thành công
 */
export async function delLargeDraft(key: string): Promise<boolean> {
  const isAvailable = await checkIndexedDBAvailability();
  
  if (isAvailable) {
    try {
      await del(key);
      return true;
    } catch (err) {
      console.error("[Storage] IndexedDB delete error:", err);
    }
  }
  
  inMemoryCache.delete(key);
  return true;
}
