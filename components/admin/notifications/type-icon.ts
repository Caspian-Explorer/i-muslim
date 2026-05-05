import { createElement } from "react";
import type { LucideIcon } from "lucide-react";
import {
  HandCoins,
  Inbox,
  Mail,
  MessageCircleQuestion,
  ShieldAlert,
  UserPlus,
  Zap,
} from "lucide-react";
import type { NotificationType } from "@/types/admin";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  signup: UserPlus,
  flagged: ShieldAlert,
  donation: HandCoins,
  qa: MessageCircleQuestion,
  system: Zap,
  submission: Inbox,
  contact: Mail,
};

// Indirected through createElement so callers don't bind the resolved icon to a
// local component variable — that pattern trips react-hooks/static-components.
export function NotificationTypeIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}) {
  return createElement(TYPE_ICON[type] ?? Zap, { className });
}
