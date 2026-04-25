"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, LogIn, Users } from "lucide-react";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  getClientAuth,
  getFirebaseClientStatus,
  signInWithGoogle,
} from "@/lib/firebase/client";
import { rsvpToggleAction, fetchRsvpStatus } from "@/lib/events/rsvp";

interface Props {
  eventId: string;
  initialRsvpCount: number;
  capacity?: number;
}

export function RsvpButton({ eventId, initialRsvpCount, capacity }: Props) {
  const status = getFirebaseClientStatus();
  const auth = status.configured ? getClientAuth() : null;
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [rsvped, setRsvped] = useState(false);
  const [count, setCount] = useState(initialRsvpCount);
  const [pending, startTransition] = useTransition();
  const t = useTranslations("eventsPublic.rsvp");

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        u.getIdToken().then(async (token) => {
          const res = await fetchRsvpStatus(eventId, token);
          setRsvped(res.rsvped);
        });
      } else {
        setRsvped(false);
      }
    });
    return () => unsubscribe();
  }, [eventId, auth]);

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("signInFailed"));
    }
  }

  async function handleToggle() {
    if (!user) return;
    const token = await user.getIdToken();
    startTransition(async () => {
      const result = await rsvpToggleAction(eventId, token);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRsvped(result.rsvped);
      setCount(result.rsvpCount);
      toast.success(result.rsvped ? t("rsvpedToast") : t("removedToast"));
    });
  }

  if (!status.configured) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {t("notConfigured")}
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
    );
  }

  const full = capacity != null && count >= capacity && !rsvped;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {user ? (
        <Button
          onClick={handleToggle}
          disabled={pending || full}
          variant={rsvped ? "secondary" : "primary"}
          aria-busy={pending}
        >
          {rsvped ? (
            <>
              <Check /> {t("rsvped")}
            </>
          ) : full ? (
            t("full")
          ) : (
            t("rsvp")
          )}
        </Button>
      ) : (
        <Button onClick={handleSignIn}>
          <LogIn /> {t("signInToRsvp")}
        </Button>
      )}
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
        <Users className="size-4" />
        {capacity != null
          ? t("rsvpOfCapacity", { count, capacity })
          : t("rsvpCount", { count })}
      </span>
    </div>
  );
}
