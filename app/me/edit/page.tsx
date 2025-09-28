// app/me/edit/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import NextLink from "next/link";
import Grid from "@mui/material/Grid";
import { createClient } from "@/lib/supabase";
import { useAuthCallbackOnThisPage } from "@/app/_hooks/useAuthCallbackOnThisPage";

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  job: string | null;
  notifications_enabled?: boolean | null;
};

const JOB_OPTIONS = [
  "美容師",
  "理容師",
  "カラーリスト",
  "アイリスト",
  "ネイリスト",
  "エステティシャン",
  "セラピスト",
  "メイクアップアーティスト",
  "スパニスト",
  "インストラクター/講師",
  "サロンオーナー/マネージャー",
  "その他",
];

export default function EditProfilePage() {
  useAuthCallbackOnThisPage();

  const supabase = useMemo(() => createClient(), []);
  const [uid, setUid] = useState<string | null>(null);

  // 状態
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false); // ← 通知の即時保存状態
  const [message, setMessage] = useState<string | null>(null);
  const [errorUserName, setErrorUserName] = useState<string | null>(null);

  // 入力
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [job, setJob] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // 画像
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : currentAvatarUrl || ""),
    [file, currentAvatarUrl]
  );
  const prevBlobRef = useRef<string | null>(null);
  useEffect(() => {
    if (file && previewUrl.startsWith("blob:")) {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = previewUrl;
    }
    return () => {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
    };
  }, [previewUrl, file]);

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
        .select(
          "user_id, username, display_name, avatar_url, job, notifications_enabled"
        )
        .eq("user_id", id)
        .maybeSingle();

      if (e2) setMessage(e2.message);

      setUsername((p?.username ?? "") as string);
      setDisplayName((p?.display_name ?? "") as string);
      setCurrentAvatarUrl((p?.avatar_url ?? "") as string);
      setJob((p?.job ?? "") as string);
      setNotificationsEnabled(p?.notifications_enabled ?? true);

      setLoading(false);
    })();
  }, [supabase]);

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

  // 通知：スイッチ切替で即時保存（楽観更新）
  const handleToggleNotifications = async (next: boolean) => {
    if (!uid || notifSaving) return;
    const prev = notificationsEnabled;
    setNotificationsEnabled(next); // 楽観更新
    setNotifSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: uid, notifications_enabled: next });
      if (error) {
        setNotificationsEnabled(prev); // ロールバック
        setMessage(error.message || "通知設定の更新に失敗しました");
      } else {
        setMessage(next ? "通知をオンにしました" : "通知をオフにしました");
      }
    } catch (e: any) {
      setNotificationsEnabled(prev);
      setMessage(e?.message || "通知設定の更新に失敗しました");
    } finally {
      setNotifSaving(false);
    }
  };

  // 保存（他フィールド）
  const handleSave = async () => {
    if (!uid) return;
    if (errorUserName) return;

    setSaving(true);
    try {
      let finalAvatarUrl = currentAvatarUrl;
      if (file) {
        const ext = (file.name.split(".").pop() || "webp").toLowerCase();
        const path = `${uid}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("public-images")
          .upload(path, file, { upsert: false, cacheControl: "3600" });
        if (upErr) throw upErr;

        const { data } = supabase.storage
          .from("public-images")
          .getPublicUrl(path);
        finalAvatarUrl = data.publicUrl;
      }

      const payload: Profile = {
        user_id: uid,
        username: username || null,
        display_name: displayName || null,
        avatar_url: finalAvatarUrl || null,
        job: job || null,
        // notifications_enabled は即時保存なのでここでは触らない
      };

      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;

      setCurrentAvatarUrl(finalAvatarUrl);
      setFile(null);
      setMessage("保存しました");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "保存に失敗しました");
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
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          プロフィール編集
        </Typography>
        <Link component={NextLink} href="/me" underline="hover">
          ← マイページへ戻る
        </Link>
      </Stack>

      <Card variant="outlined" sx={{ overflow: "hidden" }}>
        <CardHeader
          title="基本情報"
          subheader="ユーザー名は英数字とアンダースコアのみ（3〜32文字）。通知はスイッチで即時反映されます。"
        />
        {loading && <LinearProgress />}
        <CardContent>
          <Grid container spacing={3}>
            {/* 左カラム */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="ユーザー名（3〜32文字、英数字・_）"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={(e) => checkUsernameDup(e.target.value)}
                  error={!!errorUserName}
                  helperText={
                    errorUserName || "URLやメンション等で使われます（任意）"
                  }
                  inputProps={{ maxLength: 32 }}
                />
                <TextField
                  label="表示名"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  inputProps={{ maxLength: 50 }}
                />

                {/* 職業 */}
                <FormControl fullWidth>
                  <InputLabel id="job-label">職業</InputLabel>
                  <Select
                    labelId="job-label"
                    label="職業"
                    value={job}
                    onChange={(e) => setJob(e.target.value as string)}
                  >
                    {JOB_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* ★ 通知設定（即時保存） */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationsEnabled}
                        onChange={(e) =>
                          handleToggleNotifications(e.target.checked)
                        }
                        disabled={notifSaving || !uid}
                      />
                    }
                    label="メール通知を受け取る"
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    週1回程度、Veenis からのお知らせ・更新情報を受け取ります。
                    {notifSaving ? " 更新中…" : " いつでもここでオン/オフできます。"}
                  </Typography>
                </Box>

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

                <Typography variant="caption" color="text.secondary">
                  ※ アイコン画像は「選択」後、<b>保存時にアップロード</b>されます。
                </Typography>
              </Stack>
            </Grid>

            {/* 右カラム：アイコン画像 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={1.5} alignItems="center">
                <Avatar
                  src={previewUrl || undefined}
                  sx={{ width: 96, height: 96 }}
                />
                <Button
                  component="label"
                  variant="outlined"
                  disabled={!uid || saving}
                >
                  アイコン画像を選択
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f) setFile(f);
                    }}
                  />
                </Button>
                {file && (
                  <Typography variant="caption" color="text.secondary">
                    選択中: {file.name}
                  </Typography>
                )}
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
