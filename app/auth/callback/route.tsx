// app/auth/callback/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type"); // signup / magiclink / recovery / invite など
  const next = url.searchParams.get("next") || "/posts";

  if (!code) {
    const to = new URL("/auth/login", req.url);
    to.searchParams.set("err", "invalid_link");
    return NextResponse.redirect(to);
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 受け取った code をセッションに交換（ここでログイン状態になる）
  const { data: sessionRes, error: exErr } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exErr || !sessionRes?.session?.user) {
    const to = new URL("/auth/login", req.url);
    to.searchParams.set("err", exErr?.message || "sign_in_failed");
    return NextResponse.redirect(to);
  }

  const user = sessionRes.session.user;

  // パスワード再設定など別動線は分岐（必要なら）
  if (type === "recovery") {
    // 例：/auth/reset-password に飛ばしたい場合
    return NextResponse.redirect(new URL("/auth/reset-password", req.url));
  }

  // プロフィール取得して、onboarding_needed を見て分岐
  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("onboarding_needed")
    .eq("user_id", user.id)
    .maybeSingle();

  // プロフィールがまだ無い or フラグが true ⇒ オンボへ
  if (pErr || !prof || prof.onboarding_needed !== false) {
    const to = new URL("/onboarding", req.url);
    // 認証後は基本 /posts に戻す（必要なら書き換え可）
    to.searchParams.set("next", next || "/posts");
    return NextResponse.redirect(to);
  }

  // 既に完了済みなら通常遷移
  return NextResponse.redirect(new URL(next || "/posts", req.url));
}
