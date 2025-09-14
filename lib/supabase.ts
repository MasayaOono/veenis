// 共通の Supabase ラッパ（App Router対応）
import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  // ブラウザ用（クライアントコンポーネントで使用）
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function getServerSupabase() {
  // サーバ用（サーバコンポーネント／Route Handlerで使用）
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) =>
        cookieStore.set({ name, value, ...options }),
      remove: (name, options) =>
        cookieStore.set({ name, value: "", ...options, maxAge: 0 }),
    },
  });
}
