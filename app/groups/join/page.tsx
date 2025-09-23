// app/groups/join/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Link,
} from "@mui/material";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase";
export default function GroupJoinPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const tokenParam = params.get("token") ?? "";
  const errParam = params.get("err");

  const [token, setToken] = useState(tokenParam);
  const [loading, setLoading] = useState(!!tokenParam);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (errParam) setMsg(errParam);
  }, [errParam]);

  // token クエリがあれば、Route Handler 側が対応するのでここでは通常フォームとして動作
  useEffect(() => {
    if (!tokenParam) return;
    // ここではUI側の自動参加はしない（Route Handlerが担当）
    setLoading(false);
  }, [tokenParam]);

  const handleJoin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("join_group_by_token", {
      p_token: token.trim(),
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("グループに参加しました");
    router.push(`/groups/${data as string}`);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", px: 2, py: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">招待リンクから参加</Typography>
        <Link component={NextLink} href="/groups">
          ← グループ一覧へ
        </Link>
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          <TextField
            label="招待トークン"
            placeholder="例: xxxxx-yyyyy..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleJoin}
            disabled={!token.trim()}
          >
            参加する
          </Button>
          <Alert severity="info" variant="outlined">
            管理者から共有されたURL <code>/g/&lt;token&gt;</code>{" "}
            を踏むだけでも参加できます（要ログイン）。
          </Alert>
        </Stack>
      )}

      <Snackbar
        open={!!msg}
        autoHideDuration={2600}
        onClose={() => setMsg(null)}
      >
        <Alert onClose={() => setMsg(null)} severity="info" variant="filled">
          {msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
