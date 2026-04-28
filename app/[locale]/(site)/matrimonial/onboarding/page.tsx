import { redirect } from "next/navigation";

// Onboarding flow merged into the unified profile editor at /profile.
// This page exists only to redirect old links/bookmarks.
export default function MatrimonialOnboardingRedirect() {
  redirect("/profile");
}
