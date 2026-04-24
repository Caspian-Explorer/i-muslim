"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminRole, AdminUser } from "@/types/admin";

const schema = z.object({
  name: z.string().min(2, "Please enter a full name."),
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["admin", "moderator", "scholar", "member"]),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (user: AdminUser) => void;
}

export function InviteUserDrawer({ open, onOpenChange, onInvite }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "member" },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const user: AdminUser = {
        id: `u_${Math.random().toString(36).slice(2, 10)}`,
        name: values.name,
        email: values.email,
        avatarUrl: null,
        role: values.role as AdminRole,
        status: "pending",
        verified: false,
        joinedAt: now,
        lastActiveAt: now,
      };
      onInvite(user);
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>Invite user</SheetTitle>
          <SheetDescription>
            They will receive an email invitation to join the community.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Full name</Label>
            <Input id="invite-name" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              {...register("role")}
            >
              <option value="member">Member</option>
              <option value="scholar">Scholar</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <SheetFooter className="-mx-5 mt-auto">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Sending…" : <><Send /> Send invite</>}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
