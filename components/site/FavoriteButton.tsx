"use client";

import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, Heart } from "lucide-react";
import type { User } from "firebase/auth";
import { toast } from "@/components/ui/sonner";
import { getClientAuth, getFirebaseClientStatus } from "@/lib/firebase/client";
import { toggleFavoriteAction } from "@/app/[locale]/(site)/profile/actions";
import { useFavoritesContext } from "@/components/site/favorites/FavoritesContext";
import type { FavoriteItemMeta, FavoriteItemType } from "@/types/profile";
import { cn } from "@/lib/utils";

interface Props {
  itemType: FavoriteItemType;
  itemId: string;
  itemMeta: FavoriteItemMeta;
  initialFavorited?: boolean;
  variant?: "heart" | "bookmark";
  size?: "sm" | "md";
  className?: string;
  /**
   * Hide the label and only show the icon. Defaults to false.
   */
  iconOnly?: boolean;
  /**
   * Server-known auth state. When true, the button waits for the Firebase
   * client SDK to finish hydrating instead of falsely prompting an already
   * signed-in user to sign in.
   */
  signedIn?: boolean;
}

export function FavoriteButton({
  itemType,
  itemId,
  itemMeta,
  initialFavorited = false,
  variant = "heart",
  size = "sm",
  className,
  iconOnly = false,
  signedIn = false,
}: Props) {
  const ctx = useFavoritesContext();
  const ctxFavorited = ctx?.has(itemType, itemId);
  const [localFavorited, setLocalFavorited] = useState<boolean>(initialFavorited);
  const favorited = ctxFavorited ?? localFavorited;
  const [pending, startTransition] = useTransition();
  const [gating, setGating] = useState(false);
  const status = getFirebaseClientStatus();
  const auth = status.configured ? getClientAuth() : null;
  const [user, setUser] = useState<User | null>(null);
  const t = useTranslations("favorites");

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, [auth]);

  const Icon = variant === "bookmark" ? Bookmark : Heart;

  function handleAnonClick() {
    toast.error(t("signInRequired"), {
      action: {
        label: t("signInCta"),
        onClick: () => {
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        },
      },
    });
  }

  async function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    let activeUser: User | null = user;

    // Server says we're signed in but the Firebase client SDK hasn't
    // restored its session yet — wait for it before deciding instead of
    // showing the sign-in toast.
    if (!activeUser && signedIn && auth) {
      setGating(true);
      try {
        await auth.authStateReady();
        activeUser = auth.currentUser;
      } finally {
        setGating(false);
      }
    }

    if (!activeUser) {
      handleAnonClick();
      return;
    }

    const u = activeUser;
    const previous = favorited;
    const next = !favorited;
    setLocalFavorited(next);
    ctx?.set(itemType, itemId, next);

    startTransition(async () => {
      try {
        const token = await u.getIdToken();
        const result = await toggleFavoriteAction(token, { itemType, itemId, itemMeta });
        if (!result.ok) {
          setLocalFavorited(previous);
          ctx?.set(itemType, itemId, previous);
          toast.error(t("saveFailed"));
          return;
        }
        if (result.favorited !== next) {
          setLocalFavorited(result.favorited);
          ctx?.set(itemType, itemId, result.favorited);
        }
        toast.success(result.favorited ? t("savedToast") : t("removedToast"));
      } catch {
        setLocalFavorited(previous);
        ctx?.set(itemType, itemId, previous);
        toast.error(t("saveFailed"));
      }
    });
  }

  const label =
    variant === "bookmark"
      ? favorited
        ? t("matrimonial.saved")
        : t("matrimonial.save")
      : favorited
        ? t("saved")
        : t("save");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || gating}
      aria-pressed={favorited}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border transition-colors",
        size === "sm" ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm",
        favorited
          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      <Icon className={cn("size-4", favorited && "fill-current")} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}

