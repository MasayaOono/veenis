"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
};

export default function AuthDialog({ open, onClose, onSignedIn }: Props) {
  const [tab, setTab] = useState<"magic" | "otp">("magic");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCode("");
      setInfo(null);
      setError(null);
      setTab("magic");
    }
  }, [open]);

  const ensureProfile = async () => {
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return;
    // 最低限のレコードを作成（既存あれば無視）
    await supabase
      .from("profiles")
      .upsert({ user_id: uid }, {
        onConflict: "user_id",
        ignoreDuplicates: true,
      } as any);
  };

  const sendMagicLink = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    const redirect =
      typeof window !== "undefined"
        ? `${window.location.origin}/posts`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect, shouldCreateUser: true },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setInfo("ログイン用のメールリンクを送信しました。メールをご確認ください。");
  };

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setInfo(
      "確認コード（OTP）をメールに送信しました。届いた6桁を入力してください。"
    );
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email", // メールOTP
    });
    setLoading(false);
    if (error) return setError(error.message);
    await ensureProfile();
    setInfo("ログインしました。");
    onSignedIn?.();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>ログイン</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="magic" label="メールリンク" />
          <Tab value="otp" label="メールコード(OTP)" />
        </Tabs>

        <Stack spacing={2}>
          <TextField
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />

          {tab === "otp" && (
            <TextField
              label="確認コード（6桁）"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 6,
              }}
            />
          )}

          {info && <Alert severity="info">{info}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          {tab === "magic" && (
            <Typography variant="caption" color="text.secondary">
              メール内のリンクを押すとログインが完了します。Supabase の Auth
              設定で Allowed Redirect URLs に{" "}
              <code>
                {typeof window !== "undefined"
                  ? window.location.origin
                  : "http://localhost:3000"}
              </code>{" "}
              を追加しておいてください。
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {tab === "magic" ? (
          <Button onClick={sendMagicLink} disabled={loading || !email}>
            メールリンク送信
          </Button>
        ) : (
          <>
            <Button onClick={sendOtp} disabled={loading || !email}>
              コードを送る
            </Button>
            <Button
              onClick={verifyOtp}
              disabled={loading || !email || code.length < 4}
            >
              確認してログイン
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
