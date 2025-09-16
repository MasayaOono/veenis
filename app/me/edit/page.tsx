// app/me/edit/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  Link,
  LinearProgress,
} from "@mui/material";
import NextLink from "next/link";
import Grid from "@mui/material/Grid"; // v7: Grid v2（子は item 不要、size を使う）

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function EditProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorUserName, setErrorUserName] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // 初期ロード
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: me, error } = await supabase.auth.getUser();
      if (error || !me.user) {
        setMessage(error?.message ?? "未ログインです");
        setLoading(false);
        return;
      }
      const id = me.user.id;
      setUid(id);

      const { data: p, error: e2 } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .eq("user_id", id)
        .maybeSingle();
      if (e2) setMessage(e2.message);

      setUsername((p?.username ?? "") as string);
      setDisplayName((p?.display_name ?? "") as string);
      setAvatarUrl((p?.avatar_url ?? "") as string);
      setLoading(false);
    })();
  }, []);

  // バリデーション
  const isValidUsername = (v: string) => /^[a-zA-Z0-9_]{3,32}$/.test(v);
  const canSave = useMemo(() => {
    if (!uid) return false;
    if (username && !isValidUsername(username)) return false;
    return true;
  }, [uid, username]);

  // ユーザー名重複チェック
  const checkUsernameDup = async (v: string) => {
    if (!v) {
      setErrorUserName(null);
      return;
    }
    if (!isValidUsername(v)) {
      setErrorUserName("3〜32文字の英数字・アンダースコアのみ");
      return;
    }
    if (!uid) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", v)
      .neq("user_id", uid);
    if (error) {
      setErrorUserName(error.message);
      return;
    }
    setErrorUserName(
      (data ?? []).length > 0 ? "このユーザー名は既に使われています" : null
    );
  };

  // 保存
  const handleSave = async () => {
    if (!uid) return;
    if (errorUserName) return;
    setSaving(true);
    const payload: Profile = {
      user_id: uid,
      username: username || null,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    setMessage(error ? error.message : "保存しました");
  };

  // 画像アップロード（public-images バケット / {uid}/...）
  const onUploadAvatar = async (file: File) => {
    if (!uid) return;
    try {
      setSaving(true);
      const ext = file.name.split(".").pop() || "webp";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("public-images")
        .upload(path, file, {
          upsert: false,
          cacheControl: "3600",
        });
      if (upErr) throw upErr;

      const { data } = supabase.storage
        .from("public-images")
        .getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      setMessage("アイコンをアップロードしました");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">プロフィール編集</Typography>
        <Link component={NextLink} href="/me" underline="hover">
          ← マイページへ戻る
        </Link>
      </Stack>

      <Card variant="outlined">
        <CardHeader title="基本情報" />
        {loading && <LinearProgress />}
        <CardContent>
          <Grid container spacing={3}>
            {/* 左カラム */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                <TextField
                  label="ユーザー名（3〜32文字、英数字・_）"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={(e) => checkUsernameDup(e.target.value)}
                  error={!!errorUserName}
                  helperText={
                    errorUserName || "URLやメンション等で使われます（任意）"
                  }
                />
                <TextField
                  label="表示名"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <TextField
                  label="アイコンURL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  helperText="手動でURLを貼るか、右側のアップロードを使用できます"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!canSave || saving}
                  >
                    保存
                  </Button>
                  <Button component={NextLink} href="/me" disabled={saving}>
                    キャンセル
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            {/* 右カラム */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={1.5} alignItems="center">
                <Avatar
                  src={avatarUrl || undefined}
                  sx={{ width: 96, height: 96 }}
                />
                <Button
                  component="label"
                  variant="outlined"
                  disabled={!uid || saving}
                >
                  画像をアップロード
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadAvatar(f);
                    }}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  バケット: <code>public-images</code> / フォルダ:{" "}
                  <code>{uid ?? "…"}</code>
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={!!message}
        autoHideDuration={2600}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity="info"
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
