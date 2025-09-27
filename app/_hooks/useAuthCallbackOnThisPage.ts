// どこか共通コンポーネントでもOK
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function useAuthCallbackOnThisPage() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      // 既にログイン済みなら何もしない
      const { data: me } = await supabase.auth.getUser();
      if (me.user) return;

      const code = sp.get("code");
      if (code) {
        // 同端末 PKCE
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return; // セッション確立
      }

      const tokenHash = sp.get("token_hash") || sp.get("token");
      const type = sp.get("type") as
        | "signup" | "magiclink" | "recovery" | "email_change" | null;

      if (tokenHash && type) {
        // 別端末 OTP
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (!error) return; // セッション確立
      }

      // OAuth等で #access_token=... の場合の保険
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hp = new URLSearchParams(hash.replace(/^#/, ""));
      if (hp.get("access_token")) return;

      // ここまで来てセッションが無ければ、通常ログインへ
      const { data: me2 } = await supabase.auth.getUser();
      if (!me2.user) router.replace("/auth/login?err=invalid_link");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
