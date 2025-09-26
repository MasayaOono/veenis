// app/api/placeholder-cover/route.ts
import { NextResponse } from "next/server";
import { renderPlaceholderSvg } from "@/utils/placeholderCover";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "記事").slice(0, 120);
  const author = (searchParams.get("author") || "").slice(0, 80) || null;

  const svg = renderPlaceholderSvg(title, author, {
    width: 1200,
    height: 630, // OG用に 1200x630 に最適化
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // しばらくキャッシュ（変更頻度低いので長めでOK。必要なら短く）
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
