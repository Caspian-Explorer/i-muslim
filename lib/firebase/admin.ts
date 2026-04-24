import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const APP_NAME = "i-muslim-admin";
const DATABASE_ID = process.env.FIREBASE_DATABASE_ID ?? "main";

export type FirebaseAdminConfigStatus =
  | { configured: true; projectId: string; databaseId: string }
  | { configured: false; missing: string[] };

export function getFirebaseAdminStatus(): FirebaseAdminConfigStatus {
  const missing: string[] = [];
  if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
  if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!process.env.FIREBASE_PRIVATE_KEY) missing.push("FIREBASE_PRIVATE_KEY");
  if (missing.length) return { configured: false, missing };
  return {
    configured: true,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    databaseId: DATABASE_ID,
  };
}

function loadApp(): App | null {
  const status = getFirebaseAdminStatus();
  if (!status.configured) return null;

  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  return initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey,
      }),
    },
    APP_NAME,
  );
}

export function getAdminAuth(): Auth | null {
  const app = loadApp();
  return app ? getAuth(app) : null;
}

export function getDb(): Firestore | null {
  const app = loadApp();
  if (!app) return null;
  return getFirestore(app, DATABASE_ID);
}

export function requireAdminAuth(): Auth {
  const auth = getAdminAuth();
  if (!auth) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }
  return auth;
}

export function requireDb(): Firestore {
  const db = getDb();
  if (!db) {
    throw new Error(
      "Firestore is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }
  return db;
}
