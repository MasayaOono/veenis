// Server Component 専用
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getServerSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
        set(name, value, opts) {
          cookies().set(name, value, opts);
        },
        remove(name, opts) {
          cookies().set(name, "", { ...opts, maxAge: 0 });
        },
      },
    }
  );
}
