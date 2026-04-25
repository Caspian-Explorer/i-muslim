import "server-only";
import { getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { requireDb } from "@/lib/firebase/admin";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const URL_TTL_MS = 15 * 60 * 1000;

function getBucketName(): string {
  const explicit = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (explicit) return explicit;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Storage bucket not configured");
  return `${projectId}.appspot.com`;
}

function getBucket() {
  // Ensure admin app is initialized (sharing the same singleton).
  requireDb();
  const app = getApps().find((a) => a.name === "i-muslim-admin");
  if (!app) throw new Error("Admin app missing");
  return getStorage(app).bucket(getBucketName());
}

export interface UploadUrlInput {
  businessId: string;
  filename: string;
  contentType: string;
  contentLength: number;
}

export interface UploadUrlResult {
  url: string;
  storagePath: string;
  expiresAt: string;
}

function safeFilename(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  return cleaned.slice(-80);
}

export async function createUploadUrl(input: UploadUrlInput): Promise<UploadUrlResult> {
  if (!ALLOWED_MIME.has(input.contentType)) {
    throw new Error(`Unsupported content type: ${input.contentType}`);
  }
  if (input.contentLength <= 0 || input.contentLength > MAX_BYTES) {
    throw new Error(`File size must be 1..${MAX_BYTES} bytes`);
  }
  const bucket = getBucket();
  const ts = Date.now();
  const storagePath = `businesses/${input.businessId}/${ts}-${safeFilename(input.filename)}`;
  const file = bucket.file(storagePath);
  const expires = Date.now() + URL_TTL_MS;
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: input.contentType,
    extensionHeaders: { "content-length": String(input.contentLength) },
  });
  return {
    url,
    storagePath,
    expiresAt: new Date(expires).toISOString(),
  };
}

export function publicUrlFor(storagePath: string): string {
  const bucket = getBucketName();
  return `https://storage.googleapis.com/${bucket}/${encodeURI(storagePath)}`;
}

export async function deleteStorageObject(storagePath: string): Promise<void> {
  try {
    await getBucket().file(storagePath).delete({ ignoreNotFound: true });
  } catch (err) {
    console.warn("[businesses/storage] delete failed:", err);
  }
}
