import { NextRequest, NextResponse } from "next/server";
import { getSiteSession } from "@/lib/auth/session";
import { listComments } from "@/lib/comments/data";
import { getUserReactionsForComments } from "@/lib/comments/reactions";
import { isCommentEntityType } from "@/types/comments";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const parentIdRaw = url.searchParams.get("parentId");
  const pageRaw = url.searchParams.get("page");
  const pageSizeRaw = url.searchParams.get("pageSize");

  if (!isCommentEntityType(entityType)) {
    return NextResponse.json({ error: "Bad entityType" }, { status: 400 });
  }
  if (!entityId) {
    return NextResponse.json({ error: "Missing entityId" }, { status: 400 });
  }

  const parentId = parentIdRaw && parentIdRaw !== "null" ? parentIdRaw : null;
  const page = pageRaw ? Number(pageRaw) : 1;
  const pageSize = pageSizeRaw ? Number(pageSizeRaw) : undefined;

  const result = await listComments({
    entityType,
    entityId,
    parentId,
    page: Number.isFinite(page) ? page : 1,
    pageSize: pageSize && Number.isFinite(pageSize) ? pageSize : undefined,
  });

  const session = await getSiteSession();
  let userReactions: Record<string, string> = {};
  if (session && result.comments.length) {
    const map = await getUserReactionsForComments(
      session.uid,
      result.comments.map((c) => c.id),
    );
    userReactions = Object.fromEntries(map.entries());
  }

  return NextResponse.json({
    comments: result.comments,
    hasMore: result.hasMore,
    page: result.page,
    pageSize: result.pageSize,
    userReactions,
  });
}
