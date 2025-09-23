// app/users/[username]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
  Alert,
  Button,
} from "@mui/material";
import NextLink from "next/link";
import PostCard from "@/app/_components/PostCard";

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type PostRow = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  published_at: string | null;
  author_id: string;
};

// groups は単一オブジェクト or null を想定
type GroupRow = {
  groups: { id: string; name: string; owner_id: string } | null;
  role: "owner" | "admin" | "member";
};

// API からの生データ（配列で返る場合に備えるための緩い型）
type RawGroupRow = {
  role: string;
  groups?:
    | { id: string; name: string; owner_id: string }
    | { id: string; name: string; owner_id: string }[]
    | null;
};

export default function UserProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const { username } = useParams<{ username: string }>();

  const [meId, setMeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [draftCount, setDraftCount] = useState<number>(0);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!username) return;
      setLoading(true);
      setErr(null);

      // ログインユーザー
      const { data: me } = await supabase.auth.getUser();
      setMeId(me.user?.id ?? null);

      // プロフィール取得
      const profRes = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, created_at")
        .eq("username", username)
        .maybeSingle();

      if (profRes.error || !profRes.data) {
        setErr("ユーザーが見つかりません。");
        setLoading(false);
        return;
      }
      const prof = profRes.data as Profile;
      setProfile(prof);

      // 公開/グループ記事
      const postRes = await supabase
        .from("posts")
        .select("id, title, slug, cover_image_url, published_at, author_id")
        .eq("author_id", prof.user_id)
        .eq("is_published", true)
        .in("visibility", ["public", "group"])
        .order("published_at", { ascending: false });

      if (!postRes.error && postRes.data) {
        const list = postRes.data as PostRow[];
        setPosts(list);

        // いいね総数
        if (list.length > 0) {
          const ids = list.map((p) => p.id);
          const likesRes = await supabase
            .from("post_likes")
            .select("post_id")
            .in("post_id", ids);

          if (!likesRes.error && likesRes.data) {
            const counts = new Map<string, number>();
            for (const row of likesRes.data as { post_id: string }[]) {
              counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
            }
            const total = Array.from(counts.values()).reduce(
              (a, b) => a + b,
              0
            );
            setTotalLikes(total);
          }
        }
      }

      // 自分のページなら下書き数
      if (me.user?.id && me.user.id === prof.user_id) {
        const drafts = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", prof.user_id)
          .eq("is_published", false);
        if (!drafts.error) setDraftCount(drafts.count ?? 0);
      }

      // 所属グループ（配列で返る場合を正規化）
      const gmRes = await supabase
        .from("group_members")
        .select("role, groups ( id, name, owner_id )")
        .eq("user_id", prof.user_id);

      if (!gmRes.error && gmRes.data) {
        const normalized: GroupRow[] = (gmRes.data as RawGroupRow[]).map(
          (r) => {
            const g = Array.isArray(r.groups)
              ? r.groups[0] ?? null
              : r.groups ?? null;
            const role =
              r.role === "owner" || r.role === "admin" || r.role === "member"
                ? r.role
                : "member";
            return { role, groups: g };
          }
        );
        setGroups(normalized);
      }

      setLoading(false);
    })();
  }, [username]);

  const isMe = useMemo(
    () => !!(meId && profile && meId === profile.user_id),
    [meId, profile]
  );

  if (loading) return <Typography sx={{ p: 3 }}>読み込み中…</Typography>;
  if (err || !profile)
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {err ?? "表示できません"}
      </Alert>
    );

  const displayName = profile.display_name || profile.username || "Unknown";
  const joined = new Date(profile.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 3 }}>
      {/* ヘッダー */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Avatar
            src={profile.avatar_url ?? undefined}
            alt={displayName}
            sx={{ width: 72, height: 72 }}
          />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {displayName}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 0.5, color: "text.secondary" }}
            >
              <Typography variant="body2">@{profile.username}</Typography>
              <span>・</span>
              <Typography variant="body2">登録日 {joined}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label={`記事 ${posts.length} 件`} size="small" />
              <Chip label={`総いいね ${totalLikes}`} size="small" />
              {isMe && (
                <Chip
                  label={`下書き ${draftCount} 件`}
                  size="small"
                  color="default"
                />
              )}
            </Stack>
          </Box>

          {isMe && (
            <Button
              component={NextLink}
              href="/me"
              variant="outlined"
              size="small"
            >
              プロフィール編集へ
            </Button>
          )}
        </Stack>

        {/* 所属グループ */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            所属グループ（あなたに表示できる範囲）
          </Typography>
          {groups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              表示できるグループはありません。
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {groups.map((g, idx) => (
                <Chip
                  key={idx}
                  component={g.groups ? NextLink : "div"}
                  href={g.groups ? `/groups/${g.groups.id}` : undefined}
                  clickable={!!g.groups}
                  label={
                    g.groups
                      ? `${g.groups.name}（${g.role}）`
                      : `権限なし（${g.role}）`
                  }
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* 記事一覧 */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        {posts.length === 0 ? (
          <Alert severity="info">公開記事はまだありません。</Alert>
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              title={p.title}
              cover_image_url={p.cover_image_url}
              likeCount={0} // ← ダミー値（PostCard 側で省略可にしてもOK）
              author={{
                display_name: profile.display_name,
                username: profile.username,
                avatar_url: profile.avatar_url,
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
