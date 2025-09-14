// app/g/[token]/route.ts

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Supabase Auth Helpers は Edge 非対応のため Node.js 実行に固定
export const runtime = "nodejs";
// 認証・Cookie を扱うのでキャッシュさせない
export const dynamic = "force-dynamic";

// Next.js 15: params は Promise になりました
type Params = Promise<{ token: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { token } = await params; // ← 必ず await

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 未ログインならログイン画面へ（戻り先に現在の /g/[token] を付与）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect_to", `/g/${encodeURIComponent(token)}`);
    return NextResponse.redirect(url);
  }

  // グループ参加（RPC）
  const { data, error } = await supabase.rpc("join_group_by_token", {
    p_token: token,
  });

  if (error) {
    const url = new URL("/groups/join", req.url);
    url.searchParams.set("err", error.message);
    return NextResponse.redirect(url);
  }

  // 返却値を安全に取り出し（string 前提）
  if (typeof data !== "string") {
    const url = new URL("/groups/join", req.url);
    url.searchParams.set("err", "Invalid RPC response");
    return NextResponse.redirect(url);
  }

  // 成功 → 詳細へ
  return NextResponse.redirect(new URL(`/groups/${data}`, req.url));
}
