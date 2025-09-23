"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Box, CircularProgress, Alert, Stack } from "@mui/material";

export default function JoinGroupClient({ token }: { token?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) {
        setErr("招待トークンがありません。");
        return;
      }

      // 必要ならログインチェック（ミドルウェアで守っていれば不要）
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        const next = `/groups/join?token=${encodeURIComponent(token)}`;
        router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const { data, error } = await supabase.rpc("join_group_by_token", {
        p_token: token,
      });

      if (error) {
        setErr(error.message || "参加に失敗しました。");
        return;
      }
      if (typeof data === "string") {
        router.replace(`/groups/${data}`);
      } else {
        setErr("無効な応答を受け取りました。");
      }
    })();
  }, [token, supabase, router]);

  return (
    <Box sx={{ display: "grid", placeItems: "center", height: "40vh" }}>
      <Stack spacing={2} alignItems="center">
        {!err ? <CircularProgress /> : <Alert severity="error">{err}</Alert>}
      </Stack>
    </Box>
  );
}
