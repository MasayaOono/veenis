// /lib/supabase.ts
import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function getServerSupabase() {
  // Next.js 15: cookies() は Promise なので await 必須
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // すべての Cookie を読み出し
      getAll: () => cookieStore.getAll(),
      // 複数 Cookie を一括で設定（削除時は maxAge: 0 を含む形で渡ってくる）
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
