"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Keyboard, LogOut, ScrollText, Settings, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutClient } from "@/lib/firebase/client";
import { initials } from "@/lib/utils";

interface UserMenuProps {
  name: string | null;
  email: string;
  picture: string | null;
}

export function UserMenu({ name, email, picture }: UserMenuProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOutClient();
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
          <Avatar className="size-8">
            {picture && <AvatarImage src={picture} alt="" />}
            <AvatarFallback>{initials(name ?? email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="flex flex-col normal-case tracking-normal">
          <span className="text-sm font-medium text-foreground truncate">{name ?? "Administrator"}</span>
          <span className="text-xs font-normal text-muted-foreground truncate">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/settings"><UserIcon /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/settings"><Settings /> Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/activity"><ScrollText /> Activity log</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Keyboard /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onClick={handleSignOut} disabled={signingOut}>
          <LogOut /> {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
