import crypto from "crypto";

function getEncryptionKey(): Buffer {
  const keySecret = process.env.DB_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keySecret) {
    throw new Error("Missing DB_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY for encryption.");
  }
  // Generate a consistent 32-byte key using SHA-256 hash of the secret
  return crypto.createHash("sha256").update(keySecret).digest();
}

/**
 * Encrypts a plaintext string using aes-256-cbc.
 * Returns the format "ivHex:encryptedHex".
 */
export function encrypt(text: string): string {
  if (!text) return text;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an encrypted string in the format "ivHex:encryptedHex" using aes-256-cbc.
 * Fallbacks gracefully to returning the original string if decryption fails or format is invalid.
 */
export function decrypt(text: string): string {
  if (!text) return text;
  const parts = text.split(":");
  if (parts.length !== 2) return text; // Graceful fallback for unencrypted/old data
  try {
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // Graceful fallback for decryption errors (e.g. invalid key or non-encrypted data)
    return text;
  }
}

function getSettingsEncryptionKey(): Buffer {
  const keySecret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keySecret) {
    throw new Error("Missing SETTINGS_ENCRYPTION_KEY, DB_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY for settings encryption.");
  }
  return crypto.createHash("sha256").update(keySecret).digest();
}

/**
 * Encrypts settings plaintext using aes-256-cbc.
 */
export function encryptSettings(text: string): string {
  if (!text) return text;
  const key = getSettingsEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts settings ciphertext using aes-256-cbc.
 */
export function decryptSettings(text: string): string {
  if (!text) return text;
  const parts = text.split(":");
  if (parts.length !== 2) return text;
  try {
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const key = getSettingsEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text;
  }
}
