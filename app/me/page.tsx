// app/me/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Skeleton,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  CardHeader,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // ★ v7: Grid v2（子は size を使う）
import NextLink from "next/link";

/** ===== 型 ===== */
type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type GroupRow = {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
};

type MyPost = {
  id: string;
  title: string;
  slug: string;
  visibility: "public" | "link" | "group" | "draft";
  is_published: boolean;
  group_id: string | null;
  published_at: string | null;
  updated_at: string;
};

type FeedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
  read_minutes: number | null;
  author_id: string;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  like_count: number;
};

const OVERVIEW_PREVIEW_LIMIT = 5;

export default function MePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // 統計
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [totalLikes, setTotalLikes] = useState<number | null>(null);

  // ダイジェスト
  const [minePreview, setMinePreview] = useState<MyPost[] | null>(null);
  const [groupPreview, setGroupPreview] = useState<FeedPost[] | null>(null);

  const groupsCount = groups.length;

  /** ===== 初期ロード：プロフィール / グループ ===== */
  useEffect(() => {
    const load = async () => {
      const { data: me, error: e1 } = await supabase.auth.getUser();
      if (e1) {
        setMsg(e1.message);
        return;
      }
      const uid = me.user?.id;
      if (!uid) return;

      const { data: p, error: e2 } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .eq("user_id", uid)
        .maybeSingle();
      if (e2) setMsg(e2.message);
      if (p) setProfile(p as Profile);

      const { data: gm, error: e3 } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", uid);
      if (e3) setMsg(e3.message);

      const ids = (gm ?? []).map((x: any) => x.group_id);
      if (ids.length) {
        const { data: gs, error: e4 } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", ids);
        if (e4) setMsg(e4.message);
        const list: GroupRow[] = (gs ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          role: (gm ?? []).find((m: any) => m.group_id === g.id)!.role,
        }));
        setGroups(list);
      } else {
        setGroups([]);
      }
    };
    load();
  }, []);

  /** ===== 統計の取得 ===== */
  useEffect(() => {
    const loadStats = async () => {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;
      if (!uid) {
        setPublishedCount(0);
        setDraftCount(0);
        setTotalLikes(0);
        return;
      }

      // 公開記事数
      const pubRes = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", uid)
        .eq("is_published", true);
      setPublishedCount(pubRes.count ?? 0);

      // 下書き記事数
      const draftRes = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", uid)
        .eq("is_published", false);
      setDraftCount(draftRes.count ?? 0);

      // 総いいね数
      const likeRes = await supabase
        .from("post_likes")
        .select("post_id, posts!inner(id,author_id)", {
          count: "exact",
          head: true,
        })
        .eq("posts.author_id", uid);
      setTotalLikes(likeRes.count ?? 0);
    };
    loadStats();
  }, []);

  /** ===== ダイジェスト読み込み ===== */
  useEffect(() => {
    const loadPreviews = async () => {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;

      // 自分の投稿プレビュー（下書き含む）
      if (uid) {
        const { data, error } = await supabase
          .from("posts")
          .select(
            "id, title, slug, visibility, is_published, group_id, published_at, updated_at"
          )
          .eq("author_id", uid)
          .order("updated_at", { ascending: false })
          .limit(OVERVIEW_PREVIEW_LIMIT);
        if (error) setMsg(error.message);
        setMinePreview((data ?? []) as MyPost[]);
      } else {
        setMinePreview([]);
      }

      // 所属グループ/公開の新着プレビュー
      const { data: feed, error: e2 } = await supabase.rpc("list_posts", {
        p_q: null,
        p_sort: "new",
        p_limit: OVERVIEW_PREVIEW_LIMIT,
        p_offset: 0,
      });
      if (e2) setMsg(e2.message);
      setGroupPreview((feed ?? []) as FeedPost[]);
    };
    loadPreviews();
  }, []);

  /** ===== 表示ユーティリティ ===== */
  const visibilityChip = (v: MyPost["visibility"], is_published: boolean) => {
    if (!is_published) return <Chip size="small" label="下書き" />;
    if (v === "public") return <Chip size="small" label="公開" />;
    if (v === "group") return <Chip size="small" label="グループ限定" />;
    if (v === "link") return <Chip size="small" label="リンク限定" />;
    return null;
  };

  /** ===== JSX ===== */
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        マイページ
      </Typography>

      {/* 2カラム（sm以下は縦積み） */}
      <Grid container spacing={3}>
        {/* 左：ユーザー情報カード */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardHeader
              avatar={<Avatar src={profile?.avatar_url ?? undefined} />}
              title={
                profile ? (
                  profile.display_name ?? profile.username ?? "ユーザー"
                ) : (
                  <Skeleton width={120} />
                )
              }
              subheader={profile?.username ? `@${profile.username}` : ""}
              action={
                <Button
                  component={NextLink}
                  href="/me/edit"
                  size="small"
                  variant="outlined"
                >
                  編集
                </Button>
              }
            />
            <CardContent>
              {/* 統計 */}
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  ユーザー情報
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Stat label="公開記事" value={publishedCount} />
                  <Stat label="下書き" value={draftCount} />
                  <Stat label="総いいね" value={totalLikes} />
                  <Stat label="参加グループ" value={groupsCount} />
                </Stack>

                {/* 所属グループ一覧（軽く） */}
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  所属グループ
                </Typography>
                <Stack spacing={0.5}>
                  {groups.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      参加中のグループはありません
                    </Typography>
                  )}
                  {groups.slice(0, 6).map((g) => (
                    <Stack
                      key={g.id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Link component={NextLink} href={`/groups/${g.id}`}>
                        {g.name}
                      </Link>
                      <Typography variant="caption" color="text.secondary">
                        {g.role}
                      </Typography>
                    </Stack>
                  ))}
                  {groups.length > 6 && (
                    <Typography variant="caption" color="text.secondary">
                      ほか {groups.length - 6} 件…
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 右：記事ダイジェスト（自分の投稿 / 所属グループ新着） */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
            {/* 自分の投稿（最新プレビュー） */}
            <Stack spacing={1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
              >
                <Typography variant="h6">自分の投稿（最新）</Typography>
                <Button component={NextLink} href="/me/posts?page=1">
                  すべて見る
                </Button>
              </Stack>
              <Stack spacing={1}>
                {minePreview === null ? (
                  <Skeleton variant="rounded" height={120} />
                ) : minePreview.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    投稿はまだありません
                  </Typography>
                ) : (
                  minePreview.map((p) => (
                    <Card key={p.id} variant="outlined">
                      <CardActionArea
                        component={NextLink}
                        href={`/posts/${p.slug}`}
                      >
                        <CardContent>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            <Typography variant="subtitle1">
                              {p.title}
                            </Typography>
                            {visibilityChip(p.visibility, p.is_published)}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {p.published_at
                              ? new Date(p.published_at).toLocaleString()
                              : `更新: ${new Date(
                                  p.updated_at
                                ).toLocaleString()}`}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))
                )}
              </Stack>
            </Stack>

            {/* 所属グループ/公開（最新プレビュー） */}
            <Stack spacing={1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
              >
                <Typography variant="h6">
                  所属グループの新着（公開/グループ限定）
                </Typography>
                <Button component={NextLink} href="/me/groups?page=1">
                  すべて見る
                </Button>
              </Stack>
              <Stack spacing={1}>
                {groupPreview === null ? (
                  <Skeleton variant="rounded" height={120} />
                ) : groupPreview.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    表示できる記事がありません
                  </Typography>
                ) : (
                  groupPreview.map((p) => (
                    <Card key={p.id} variant="outlined">
                      <CardActionArea
                        component={NextLink}
                        href={`/posts/${p.slug}`}
                      >
                        <CardContent>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            <Typography variant="subtitle1">
                              {p.title}
                            </Typography>
                            <Chip size="small" label="新着" />
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.5 }}
                          >
                            <Avatar
                              src={p.author_avatar_url ?? undefined}
                              sx={{ width: 24, height: 24 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {p.author_display_name ??
                                p.author_username ??
                                "匿名"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ・
                              {p.published_at
                                ? new Date(p.published_at).toLocaleDateString()
                                : ""}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ・❤ {p.like_count}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))
                )}
              </Stack>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

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

/** ===== 小さな統計カード要素 ===== */
function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <Card variant="outlined" sx={{ px: 1.5, py: 1 }}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {value === null ? (
          <Skeleton width={32} />
        ) : (
          <Typography variant="subtitle1">{value}</Typography>
        )}
      </Stack>
    </Card>
  );
}
