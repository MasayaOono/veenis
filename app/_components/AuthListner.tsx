"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthListener() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") {
        router.replace("/onboarding?next=/posts");
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [router]);
  return null;
}
