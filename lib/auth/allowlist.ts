const ALLOWED_ADMINS = ["fuad.jalilov@gmail.com"] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_ADMINS.includes(email.toLowerCase() as (typeof ALLOWED_ADMINS)[number]);
}
