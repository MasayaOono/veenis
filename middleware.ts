// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PROTECTED = [/^\/groups(\/.*)?$/, /^\/posts\/new$/, /^\/g\/[^/]+$/];

export async function middleware(req: NextRequest) {
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
    const login = new URL("/auth/login", req.url); // ← ここはグローバルURLを使えるように
    const qs = req.nextUrl.search || "";
    login.searchParams.set("next", `${path}${qs}`);
    return NextResponse.redirect(login);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
