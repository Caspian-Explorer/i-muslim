"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut as fbSignOut,
  type Auth,
  type User,
} from "firebase/auth";

export type FirebaseClientConfigStatus =
  | { configured: true }
  | { configured: false; missing: string[] };

export function getFirebaseClientStatus(): FirebaseClientConfigStatus {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (missing.length) return { configured: false, missing };
  return { configured: true };
}

let cachedApp: FirebaseApp | null = null;

function getClientApp(): FirebaseApp | null {
  const status = getFirebaseClientStatus();
  if (!status.configured) return null;

  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApp();
    return cachedApp;
  }

  cachedApp = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  });
  return cachedApp;
}

export function getClientAuth(): Auth | null {
  const app = getClientApp();
  return app ? getAuth(app) : null;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getClientAuth();
  if (!auth) throw new Error("Firebase client is not configured.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutClient(): Promise<void> {
  const auth = getClientAuth();
  if (auth) await fbSignOut(auth);
}
