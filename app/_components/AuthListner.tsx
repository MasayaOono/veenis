// app/_components/AuthListener.tsx
"use client";
import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase"; // ← これだけでOK

export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Cookie同期（必要なら）
      await fetch("/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          access_token: session?.access_token ?? null,
          refresh_token: session?.refresh_token ?? null,
        }),
      });
      router.refresh();

      if (event === "SIGNED_IN") {
        const next = search?.get("next");
        if (pathname.startsWith("/auth/") && next) router.replace(next);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, pathname, search, supabase]);

  return null;
}
