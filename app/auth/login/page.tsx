"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
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
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return;
  await supabase
    .from("profiles")
    .upsert({ user_id: uid }, { onConflict: "user_id" });
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    await ensureProfile();
    router.replace("/posts");
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
            アカウント未作成？{" "}
            <Link component={NextLink} href="/auth/signup">
              新規登録へ
            </Link>
          </Typography>
        </Stack>
      </form>
    </Box>
  );
}
