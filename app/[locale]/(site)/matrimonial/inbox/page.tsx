import { redirect } from "next/navigation";

// Inbox now lives under /profile/matrimonial alongside the enable/disable toggle.
// This page exists only to redirect old links/bookmarks.
export default function MatrimonialInboxRedirect() {
  redirect("/profile/matrimonial");
}
