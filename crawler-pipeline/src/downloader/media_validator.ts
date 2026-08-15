import { readSync, openSync, closeSync, statSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";

export interface ValidationResult {
  valid: boolean;
  fileSize: number;
  magicBytesHex?: string;
  checksum?: string;
  error?: string;
}

export interface ValidationOptions {
  minSizeBytes?: number;
  verifyMagicBytes?: boolean;
  calculateChecksum?: boolean;
}

/**
 * # Media Validator
 * Kiểm tra tính hợp lệ và toàn vẹn dữ liệu của file media đã tải về
 */
export class MediaValidator {
  /**
   * # Kiểm tra file media theo cấu hình validation
   */
  static async validateFile(
    filePath: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const minSizeBytes = options.minSizeBytes ?? 1024; // Mặc định > 1KB (tránh HTML error page 0KB/1KB)
    const verifyMagicBytes = options.verifyMagicBytes ?? true;
    const calculateChecksum = options.calculateChecksum ?? true;

    try {
      const stat = statSync(filePath);
      if (stat.size < minSizeBytes) {
        return {
          valid: false,
          fileSize: stat.size,
          error: `Dung lượng file quá nhỏ (${stat.size} bytes < ${minSizeBytes} bytes). Có thể là HTML error page hoặc connection reset.`,
        };
      }

      let magicHex = "";
      if (verifyMagicBytes) {
        const fd = openSync(filePath, "r");
        const buffer = Buffer.alloc(12);
        readSync(fd, buffer, 0, 12, 0);
        closeSync(fd);
        magicHex = buffer.toString("hex");

        const isMp4 = magicHex.includes("66747970"); // 'ftyp'
        const isWebm = magicHex.startsWith("1a45dfa3"); // EBML / WebM / MKV header
        const isFlv = magicHex.startsWith("464c56"); // 'FLV'

        if (!isMp4 && !isWebm && !isFlv) {
          return {
            valid: false,
            fileSize: stat.size,
            magicBytesHex: magicHex,
            error: `Magic bytes không khớp định dạng video (Header hex: ${magicHex}). File có thể bị hỏng hoặc lỗi định dạng.`,
          };
        }
      }

      let checksum = "";
      if (calculateChecksum) {
        checksum = await this.computeHash(filePath);
      }

      return {
        valid: true,
        fileSize: stat.size,
        magicBytesHex: magicHex,
        checksum,
      };
    } catch (err: any) {
      return {
        valid: false,
        fileSize: 0,
        error: `Lỗi đọc file validation: ${err.message || err}`,
      };
    }
  }

  private static computeHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash("md5");
      const stream = createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }
}
