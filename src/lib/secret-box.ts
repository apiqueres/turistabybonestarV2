import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado simétrico (AES-256-GCM) de secretos guardados en la base de datos, como la contraseña
 * de aplicación de Google de cada usuario. La clave sale de APP_SECRET_KEY (32 bytes en base64).
 * Formato: v1:<iv>:<etiqueta>:<datos>, todo en base64.
 */
function key(): Buffer {
  const raw = process.env.APP_SECRET_KEY;
  if (!raw) throw new Error("APP_SECRET_KEY no está definida");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("APP_SECRET_KEY debe ser 32 bytes en base64 (openssl rand -base64 32)");
  return k;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
  const [version, iv, tag, data] = payload.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Formato de secreto no válido");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
