// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ★ dev用ゲート（Basic認証）を有効にするかどうか
const DEV_USER = process.env.DEV_BASIC_USER;
const DEV_PASS = process.env.DEV_BASIC_PASS;

// Supabaseで守るルート（従来どおり）
const PROTECTED = [/^\/groups(\/.*)?$/, /^\/posts\/new$/, /^\/g\/[^/]+$/];

function needBasicGate() {
  // 環境変数がセットされていれば devゲートを有効化（本番では未設定にする）
  return Boolean(DEV_USER && DEV_PASS);
}

function parseBasicAuth(header: string | null) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    return { user, pass };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // ===== ① devプロジェクト限定：Basic認証ゲート =====
  if (needBasicGate()) {
    const creds = parseBasicAuth(req.headers.get("authorization"));
    const ok = creds && creds.user === DEV_USER && creds.pass === DEV_PASS;
    if (!ok) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
      });
    }
  }

  // ===== ② ここから従来のSupabaseベースの保護（特定ページのみ） =====
  const res = NextResponse.next();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some((re) => re.test(path));
  const isAuthArea = path.startsWith("/auth/");

  if (isProtected && !user && !isAuthArea) {
    const login = new URL("/auth/login", req.url);
    const qs = req.nextUrl.search || "";
    login.searchParams.set("next", `${path}${qs}`); // 戻り先
    return NextResponse.redirect(login);
  }

  return res;
}

export const config = {
  matcher: [
    // 静的/画像などは除外
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
