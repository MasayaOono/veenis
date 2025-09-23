// app/auth/sync/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });

  const { event, access_token, refresh_token } = await req.json();

  const supabase = createServerClient(URL, KEY, {
    cookies: {
      // 受信クッキーは req からまとめて読む
      getAll: () => req.cookies.getAll(),
      // 発行する Set-Cookie は res にまとめて書く
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  // サインイン/更新/初期セッション → サーバーCookieへ反映
  if (
    (event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "INITIAL_SESSION") &&
    access_token &&
    refresh_token
  ) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }

  // サインアウト → Cookie破棄
  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return res;
}
