// app/auth/login/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase"; // ← これを使う
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  Link,
} from "@mui/material";
import NextLink from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = useMemo(() => createClient(), []); // ← ブラウザ用クライアント

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureProfile = async () => {
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return;
    await supabase
      .from("profiles")
      .upsert({ user_id: uid }, { onConflict: "user_id" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // ★ 重要：ログイン直後にサーバーCookieへ同期（middlewareが見えるように）
    if (data.session) {
      await fetch("/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "SIGNED_IN",
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });
    }

    await ensureProfile();

    // SSRへ即反映
    router.refresh();

    // next パラメータがあれば最優先で戻す
    const next = search?.get("next");
    router.replace(next || "/posts");
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
      <form onSubmit={onSubmit}>
        <Stack spacing={2} sx={{ width: 360 }}>
          <Typography variant="h5">ログイン</Typography>
          <TextField
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <Alert severity="error">{err}</Alert>}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !email || !password}
          >
            ログイン
          </Button>
          <Typography variant="body2">
            アカウント未作成の方は
            <Link component={NextLink} href="/auth/signup">
              新規登録
            </Link>
          </Typography>
        </Stack>
      </form>
    </Box>
  );
}
