"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { NoteItemType } from "@/types/notes";

export interface NoteState {
  id: string;
  text: string;
  updatedAt: string;
}

interface NotesContextValue {
  get: (itemType: NoteItemType, itemId: string) => NoteState | null;
  set: (itemType: NoteItemType, itemId: string, value: NoteState | null) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

interface NotesProviderProps {
  /**
   * Initial notes scoped to one or more itemTypes for a given page (e.g. all
   * noted ayahs on a Surah page). Each entry maps itemId -> NoteState.
   */
  initialItems: { itemType: NoteItemType; notes: Record<string, NoteState> }[];
  children: ReactNode;
}

function key(itemType: NoteItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

export function NotesProvider({ initialItems, children }: NotesProviderProps) {
  const [state, setState] = useState<Record<string, NoteState>>(() => {
    const next: Record<string, NoteState> = {};
    for (const { itemType, notes } of initialItems) {
      for (const [itemId, note] of Object.entries(notes)) {
        next[key(itemType, itemId)] = note;
      }
    }
    return next;
  });

  const value = useMemo<NotesContextValue>(
    () => ({
      get: (itemType, itemId) => state[key(itemType, itemId)] ?? null,
      set: (itemType, itemId, val) => {
        setState((prev) => {
          const k = key(itemType, itemId);
          if (val === null) {
            if (!(k in prev)) return prev;
            const { [k]: _omit, ...rest } = prev;
            void _omit;
            return rest;
          }
          return { ...prev, [k]: val };
        });
      },
    }),
    [state],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotesContext(): NotesContextValue | null {
  return useContext(NotesContext);
}
