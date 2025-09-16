// /lib/supabaseServer.ts （サーバーコンポーネント／Route Handler用）
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ★ async にする：cookies() が Promise なので await 必須
export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // すべて取得
      getAll: () => cookieStore.getAll(),
      // 複数一括設定（削除は maxAge: 0 が渡ってくる）
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          // options の型が合わない場合は as Parameters<typeof cookieStore.set>[2] を付けてOK
          cookieStore.set(
            name,
            value,
            options as Parameters<typeof cookieStore.set>[2]
          );
        });
      },
    },
  });
}
