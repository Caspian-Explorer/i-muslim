"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FavoriteItemType } from "@/types/profile";

interface FavoritesContextValue {
  has: (itemType: FavoriteItemType, itemId: string) => boolean;
  set: (itemType: FavoriteItemType, itemId: string, favorited: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

interface FavoritesProviderProps {
  /**
   * Initial favorited state, scoped to a single itemType for a given page
   * (e.g. all favorited ayahs on a Surah page). Pass an array of itemIds.
   */
  initialItems: { itemType: FavoriteItemType; itemIds: string[] }[];
  children: ReactNode;
}

export function FavoritesProvider({ initialItems, children }: FavoritesProviderProps) {
  const [state, setState] = useState<Record<string, Set<string>>>(() => {
    const next: Record<string, Set<string>> = {};
    for (const { itemType, itemIds } of initialItems) {
      next[itemType] = new Set(itemIds);
    }
    return next;
  });

  const value = useMemo<FavoritesContextValue>(
    () => ({
      has: (itemType, itemId) => state[itemType]?.has(itemId) ?? false,
      set: (itemType, itemId, favorited) => {
        setState((prev) => {
          const bucket = new Set(prev[itemType] ?? []);
          if (favorited) bucket.add(itemId);
          else bucket.delete(itemId);
          return { ...prev, [itemType]: bucket };
        });
      },
    }),
    [state],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext(): FavoritesContextValue | null {
  return useContext(FavoritesContext);
}
