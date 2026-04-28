"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { toast } from "@/components/ui/sonner";
import { getClientAuth, getFirebaseClientStatus } from "@/lib/firebase/client";
import { removeFavoriteAction } from "@/app/[locale]/(site)/profile/actions";

interface Props {
  favoriteId: string;
}

export function RemoveFavoriteButton({ favoriteId }: Props) {
  const router = useRouter();
  const status = getFirebaseClientStatus();
  const auth = status.configured ? getClientAuth() : null;
  const [user, setUser] = useState<User | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useTranslations("favorites");

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, [auth]);

  function handleClick() {
    if (!user) return;
    startTransition(async () => {
      try {
        const token = await user.getIdToken();
        const result = await removeFavoriteAction(token, favoriteId);
        if (!result.ok) {
          toast.error(t("saveFailed"));
          return;
        }
        toast.success(t("removedToast"));
        router.refresh();
      } catch {
        toast.error(t("saveFailed"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={t("remove")}
      title={t("remove")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
