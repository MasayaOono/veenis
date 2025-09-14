"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

function validateUsername(raw: string) {
  const v = raw.normalize("NFKC").toLowerCase().trim();
  // 半角英数・アンダースコア・ハイフン・ドット、3〜32文字
  const ok = /^[a-z0-9._-]{3,32}$/.test(v);
  return { ok, v };
}

async function uploadAvatar(file: File) {
  const { data: me } = await supabase.auth.getUser();
  const uid = me?.user?.id;
  if (!uid) throw new Error("auth required");

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${uid}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("public-images")
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("public-images").getPublicUrl(path);
  return data.publicUrl as string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/posts";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : avatarUrl || null),
    [file, avatarUrl]
  );
  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    // preview URL revoke
    if (previewUrl && previewUrl.startsWith("blob:")) {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = previewUrl;
    }
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, [previewUrl]);

  useEffect(() => {
    (async () => {
      // 認証チェック
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent("/onboarding")}`);
        return;
      }
      setUid(user.id);

      // 既存プロフィール読込
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      setUsername(prof?.username ?? "");
      setDisplayName(prof?.display_name ?? "");
      setAvatarUrl(prof?.avatar_url ?? null);

      setLoading(false);
    })();
  }, [router]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    setErr(null);
    const { ok, v } = validateUsername(username);
    if (!ok) {
      setErr("ユーザー名は半角英数字・._- の3〜32文字で入力してください。");
      return;
    }

    setSaving(true);
    try {
      // 画像は保存時にだけアップロード
      let finalAvatarUrl = avatarUrl;
      if (file) {
        finalAvatarUrl = await uploadAvatar(file);
      }

      // 自分のプロフィールだけ upsert（RLS: profiles self rw）
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: uid,
          username: v,
          display_name: displayName.trim() || null,
          avatar_url: finalAvatarUrl,
        },
        { onConflict: "user_id" }
      );
      if (error) {
        // 重複ユーザー名の考慮
        if ((error as any).code === "23505") {
          throw new Error("そのユーザー名は既に使用されています。");
        }
        throw error;
      }

      router.replace(next || "/posts");
    } catch (e: any) {
      setErr(e?.message || "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", px: 2, py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        プロフィールの初期設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ユーザー名はURLにも使われます。後から変更できます。
      </Typography>

      <form onSubmit={onSave}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={previewUrl || undefined} // 空文字は渡さない
              sx={{ width: 72, height: 72 }}
            />
            <Button variant="outlined" component="label">
              画像を選択
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={onSelectFile}
              />
            </Button>
          </Stack>

          <TextField
            label="ユーザー名（必須）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="半角英数字・ドット・アンダースコア・ハイフン、3〜32文字"
            required
            inputProps={{ maxLength: 32 }}
          />

          <TextField
            label="表示名（任意）"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            inputProps={{ maxLength: 80 }}
          />

          {err && <Alert severity="error">{err}</Alert>}

          <Stack direction="row" spacing={2} alignItems="center">
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "保存中…" : "保存してはじめる"}
            </Button>
            <Button
              type="button"
              variant="text"
              disabled={saving}
              onClick={() => router.replace(next || "/posts")}
            >
              後で設定する
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
