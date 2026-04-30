import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getDb, requireDb } from "@/lib/firebase/admin";
import {
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  type GeminiModel,
  type GeminiConfigStatus,
} from "./secrets-types";

export {
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  type GeminiModel,
  type GeminiConfigStatus,
};

const SECRETS_COLLECTION = "config";
const SECRETS_DOC = "secrets";

export type GeminiConfig = {
  apiKey: string;
  model: GeminiModel;
};

function maskKey(key: string): string {
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`;
}

function tsToIso(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "object" && v && "toDate" in v) {
    const fn = (v as { toDate: () => Date }).toDate;
    if (typeof fn === "function") return fn.call(v).toISOString();
  }
  return null;
}

function normalizeModel(raw: unknown): GeminiModel {
  if (
    typeof raw === "string" &&
    (GEMINI_MODELS as readonly string[]).includes(raw)
  ) {
    return raw as GeminiModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

export async function getGeminiConfigStatus(): Promise<GeminiConfigStatus> {
  const db = getDb();
  if (!db) {
    return { configured: false, maskedKey: null, model: DEFAULT_GEMINI_MODEL, updatedAt: null, updatedBy: null };
  }
  try {
    const snap = await db.collection(SECRETS_COLLECTION).doc(SECRETS_DOC).get();
    if (!snap.exists) {
      return { configured: false, maskedKey: null, model: DEFAULT_GEMINI_MODEL, updatedAt: null, updatedBy: null };
    }
    const data = snap.data() ?? {};
    const apiKey = (data.geminiApiKey as string | undefined) ?? "";
    return {
      configured: apiKey.length > 0,
      maskedKey: apiKey ? maskKey(apiKey) : null,
      model: normalizeModel(data.geminiModel),
      updatedAt: tsToIso(data.geminiUpdatedAt),
      updatedBy: (data.geminiUpdatedBy as string | undefined) ?? null,
    };
  } catch (err) {
    console.warn("[admin/data/secrets] read status failed:", err);
    return { configured: false, maskedKey: null, model: DEFAULT_GEMINI_MODEL, updatedAt: null, updatedBy: null };
  }
}

export async function getGeminiConfig(): Promise<GeminiConfig | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection(SECRETS_COLLECTION).doc(SECRETS_DOC).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  const apiKey = (data.geminiApiKey as string | undefined) ?? "";
  if (!apiKey) return null;
  return { apiKey, model: normalizeModel(data.geminiModel) };
}

export type SetGeminiInput = {
  apiKey?: string | null;
  model: GeminiModel;
};

export async function setGeminiConfig(
  input: SetGeminiInput,
  adminEmail: string,
): Promise<GeminiConfigStatus> {
  const db = requireDb();
  const ref = db.collection(SECRETS_COLLECTION).doc(SECRETS_DOC);
  const payload: Record<string, unknown> = {
    geminiModel: input.model,
    geminiUpdatedAt: Timestamp.now(),
    geminiUpdatedBy: adminEmail,
  };
  if (typeof input.apiKey === "string" && input.apiKey.length > 0) {
    payload.geminiApiKey = input.apiKey;
  }
  await ref.set(payload, { merge: true });
  return getGeminiConfigStatus();
}

export async function clearGeminiKey(adminEmail: string): Promise<GeminiConfigStatus> {
  const db = requireDb();
  const ref = db.collection(SECRETS_COLLECTION).doc(SECRETS_DOC);
  await ref.set(
    {
      geminiApiKey: "",
      geminiUpdatedAt: Timestamp.now(),
      geminiUpdatedBy: adminEmail,
    },
    { merge: true },
  );
  return getGeminiConfigStatus();
}
