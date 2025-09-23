"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
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

async function ensureProfile() {
  const supabase = createClient();
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return;
  await supabase
    .from("profiles")
    .upsert({ user_id: uid }, { onConflict: "user_id" });
}

export default function SignupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (password !== confirm) return setErr("パスワードが一致しません。");
    setLoading(true);

    const redirect =
      typeof window !== "undefined"
        ? `${window.location.origin}/posts`
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect },
    });

    setLoading(false);

    if (error) return setErr(error.message);

    // メール確認がオンの場合は session なし → 確認メール案内
    if (!data.session) {
      setInfo(
        "確認メールを送信しました。メール内のリンクから認証を完了してください。"
      );
      return;
    }

    // すでにログイン済み（メール確認オフ構成）
    await ensureProfile();
    router.replace("/posts");
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
      <form onSubmit={onSubmit}>
        <Stack spacing={2} sx={{ width: 360 }}>
          <Typography variant="h5">新規登録</Typography>
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
          <TextField
            label="パスワード（確認）"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {err && <Alert severity="error">{err}</Alert>}
          {info && <Alert severity="info">{info}</Alert>}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !email || !password || !confirm}
          >
            新規登録
          </Button>
          <Typography variant="body2">
            すでにアカウントをお持ち？{" "}
            <Link component={NextLink} href="/auth/login">
              ログインへ
            </Link>
          </Typography>
        </Stack>
      </form>
    </Box>
  );
}
