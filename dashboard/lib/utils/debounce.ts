/**
 * Hàm trì hoãn thực thi (debounce) một function.
 * Giúp gom nhiều lượt gọi liên tiếp trong khoảng thời gian `delay` thành một lần gọi duy nhất ở cuối.
 * 
 * @param func Function cần debounce
 * @param delay Thời gian chờ (milliseconds)
 * @returns Phiên bản debounced của function truyền vào
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
