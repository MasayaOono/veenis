// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Supabase のセッションを最新化（必要ならリフレッシュ）
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 保護対象のパス（正規表現でもOK）
  const url = new URL(req.url);
  const path = url.pathname;

  const protectedPaths = [
    /^\/groups(\/.*)?$/, // /groups 配下すべて
    /^\/posts\/new$/,    // /posts/new
  ];

  const isProtected = protectedPaths.some((re) => re.test(path));

  // 未ログインかつ保護パス → /login へ 302
  if (isProtected && !session) {
    const login = new URL("/login", req.url);
    // ログイン後に元のURLへ戻れるようにクエリを付与
    login.searchParams.set("redirect_to", path + url.search);
    return NextResponse.redirect(login);
  }

  return res;
}

// このミドルウェアを有効にするパス（/_next や画像等は除外）
export const config = {
  matcher: [
    "/groups/:path*", // /groups とその配下
    "/posts/new",     // /posts/new
  ],
};
