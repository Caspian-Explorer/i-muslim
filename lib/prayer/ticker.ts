"use client";

import { useSyncExternalStore } from "react";

const DEFAULT_INTERVAL = 30_000;

interface Channel {
  cachedNow: number;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
}

const channels = new Map<number, Channel>();

function getChannel(intervalMs: number): Channel {
  let ch = channels.get(intervalMs);
  if (!ch) {
    ch = { cachedNow: 0, listeners: new Set(), timer: null };
    channels.set(intervalMs, ch);
  }
  return ch;
}

function makeSubscribe(intervalMs: number) {
  return (cb: () => void): (() => void) => {
    const ch = getChannel(intervalMs);
    if (ch.cachedNow === 0) ch.cachedNow = Date.now();
    ch.listeners.add(cb);
    if (!ch.timer) {
      ch.timer = setInterval(() => {
        ch.cachedNow = Date.now();
        for (const l of ch.listeners) l();
      }, intervalMs);
    }
    return () => {
      ch.listeners.delete(cb);
      if (ch.listeners.size === 0 && ch.timer) {
        clearInterval(ch.timer);
        ch.timer = null;
      }
    };
  };
}

function makeGetSnapshot(intervalMs: number) {
  return () => getChannel(intervalMs).cachedNow;
}

const getServerSnapshot = () => 0;

export function useNow(intervalMs: number = DEFAULT_INTERVAL): Date | null {
  const ts = useSyncExternalStore(
    makeSubscribe(intervalMs),
    makeGetSnapshot(intervalMs),
    getServerSnapshot,
  );
  return ts === 0 ? null : new Date(ts);
}
