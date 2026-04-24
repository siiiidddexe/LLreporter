import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * In production, uploads live at /data/uploads/ — the same persistent volume
 * that holds the SQLite DB. This survives container re-deploys.
 * In development they live inside public/uploads/ so Next.js serves them
 * as static files (no API route needed locally).
 */
export function uploadDir() {
  return process.env.NODE_ENV === "production"
    ? "/data/uploads"
    : path.join(process.cwd(), "public", "uploads");
}

export async function saveDataUrl(dataUrl: string): Promise<string | null> {
  // data:image/png;base64,xxxx
  const m = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const ext = m[2] === "jpeg" ? "jpg" : m[2];
  const buf = Buffer.from(m[3], "base64");
  if (buf.length > 20 * 1024 * 1024) return null; // 20 MB cap
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(dir, name), buf);
  // Path stored in DB — always /uploads/filename regardless of environment.
  return `/uploads/${name}`;
}
