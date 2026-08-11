import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";

export interface StoredFile {
  url: string;
  filename: string;
}

/**
 * Local-disk storage for dev/small-scale prod. Swap this module for an
 * S3-compatible adapter later (same `saveFile` signature) without touching
 * any caller — the products module only depends on this function, never on
 * the filesystem directly.
 */
export async function saveFile(buffer: Buffer, originalName: string): Promise<StoredFile> {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const filename = `${randomUUID()}${ext}`;
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(env.UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, filename };
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}
