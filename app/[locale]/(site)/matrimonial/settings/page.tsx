import { redirect } from "next/navigation";

// Matrimonial settings merged into the unified profile + /profile/matrimonial.
// This page exists only to redirect old links/bookmarks.
export default function MatrimonialSettingsRedirect() {
  redirect("/profile/matrimonial");
}
