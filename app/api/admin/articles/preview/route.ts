import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { renderMarkdown } from "@/lib/blog/markdown";
import { LOCALES, dirFor, type Locale } from "@/i18n/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { md?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  const md = typeof body.md === "string" ? body.md : "";
  if (md.length > 50_000) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }
  const locale = (LOCALES as readonly string[]).includes(body.locale ?? "")
    ? (body.locale as Locale)
    : ("en" as Locale);
  const html = await renderMarkdown(md, { dir: dirFor(locale) });
  return NextResponse.json({ html });
}
