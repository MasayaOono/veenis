// app/groups/[id]/page.tsx
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Divider,
  Snackbar,
  Alert,
  TextField,
  CircularProgress,
  Pagination,
  CardActionArea,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { supabase } from "@/lib/supabaseClient";

type MemberRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type GroupPost = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  published_at: string | null;
  read_minutes: number | null;
  author_id: string;
  author_display_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
};

const POSTS_PER_PAGE = 10;

export default function GroupDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gid = id as string;

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [members, setMembers] = useState<MemberRow[]>([]);

  // グループ限定記事
  const [postPage, setPostPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);
  const [posts, setPosts] = useState<GroupPost[] | null>(null);
  const [postsTotal, setPostsTotal] = useState(0);

  const inviteLink = useMemo(() => {
    if (!inviteToken || typeof window === "undefined") return null;
    const base = window.location.origin;
    return `${base}/g/${inviteToken}`;
  }, [inviteToken]);

  // ===== 基本情報読み込み（グループ/メンバー/権限） =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: g, error: gerr } = await supabase
          .from("groups")
          .select("id, name, invite_token")
          .eq("id", gid)
          .maybeSingle();
        if (gerr) throw gerr;
        if (!g) throw new Error("グループが見つかりません");
        if (!cancelled) {
          setName(g.name);
          setInviteToken(g.invite_token ?? null);
        }

        const { data: adminRes, error: aerr } = await supabase.rpc(
          "is_group_admin",
          { p_group_id: gid }
        );
        if (aerr) throw aerr;
        if (!cancelled) setIsAdmin(Boolean(adminRes));

        const { data: gm, error: merr } = await supabase
          .from("group_members")
          .select("user_id, role")
          .eq("group_id", gid);
        if (merr) throw merr;

        const uids = (gm ?? []).map((m: any) => m.user_id);
        let profMap = new Map<
          string,
          {
            display_name: string | null;
            username: string | null;
            avatar_url: string | null;
          }
        >();
        if (uids.length) {
          const { data: pr, error: perr } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, avatar_url")
            .in("user_id", uids);
          if (perr) throw perr;
          pr?.forEach((p: any) => {
            profMap.set(p.user_id, {
              display_name: p.display_name,
              username: p.username,
              avatar_url: p.avatar_url,
            });
          });
        }
        const rows: MemberRow[] = (gm ?? []).map((m: any) => {
          const prof = profMap.get(m.user_id) ?? {
            display_name: null,
            username: null,
            avatar_url: null,
          };
          return { user_id: m.user_id, role: m.role, ...prof };
        });
        if (!cancelled) setMembers(rows);
      } catch (e: any) {
        if (!cancelled) setMsg(e.message ?? "読み込みに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gid]);

  // ===== グループ限定記事の読み込み（ページング対応） =====
  const loadGroupPosts = useCallback(
    async (page: number) => {
      setPostsLoading(true);
      try {
        const from = (page - 1) * POSTS_PER_PAGE;
        const to = from + POSTS_PER_PAGE - 1;

        // まず記事本体（RLSでメンバー以外は空になる）
        const { data, count, error } = await supabase
          .from("posts")
          .select(
            "id, title, slug, cover_image_url, published_at, read_minutes, author_id",
            { count: "exact" }
          )
          .eq("group_id", gid)
          .eq("visibility", "group")
          .eq("is_published", true)
          .order("published_at", { ascending: false, nullsFirst: false })
          .range(from, to);

        if (error) throw error;

        const rows = (data ?? []) as {
          id: string;
          title: string;
          slug: string;
          cover_image_url: string | null;
          published_at: string | null;
          read_minutes: number | null;
          author_id: string;
        }[];

        // 著者情報をまとめて取得して合成
        const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
        let authorMap = new Map<
          string,
          {
            display_name: string | null;
            username: string | null;
            avatar_url: string | null;
          }
        >();
        if (authorIds.length) {
          const { data: authors, error: aerr } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, avatar_url")
            .in("user_id", authorIds);
          if (aerr) throw aerr;
          (authors ?? []).forEach((a: any) => {
            authorMap.set(a.user_id, {
              display_name: a.display_name,
              username: a.username,
              avatar_url: a.avatar_url,
            });
          });
        }

        const enriched: GroupPost[] = rows.map((r) => {
          const a = authorMap.get(r.author_id) ?? {
            display_name: null,
            username: null,
            avatar_url: null,
          };
          return {
            id: r.id,
            title: r.title,
            slug: r.slug,
            cover_image_url: r.cover_image_url ?? null,
            published_at: r.published_at,
            read_minutes: r.read_minutes,
            author_id: r.author_id,
            author_display_name: a.display_name,
            author_username: a.username,
            author_avatar_url: a.avatar_url,
          };
        });

        setPosts(enriched);
        setPostsTotal(count ?? 0);
      } catch (e: any) {
        setPosts([]);
        setPostsTotal(0);
        setMsg(e.message ?? "投稿の読み込みに失敗しました");
      } finally {
        setPostsLoading(false);
      }
    },
    [gid]
  );

  // 初回 & ページ変更で読込
  useEffect(() => {
    loadGroupPosts(postPage);
  }, [postPage, loadGroupPosts]);

  const regenerateInvite = async () => {
    const { data, error } = await supabase.rpc("regenerate_group_invite", {
      p_group_id: gid,
    });
    if (error) return setMsg(error.message);
    setInviteToken(data as string);
    setMsg("招待トークンを再発行しました");
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setMsg("招待リンクをコピーしました");
  };

  const leaveGroup = async () => {
    try {
      const { data: me } = await supabase.auth.getUser();
      const uid = me.user?.id;
      if (!uid) return;
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", gid)
        .eq("user_id", uid);
      if (error) throw error;
      setMsg("グループを脱退しました");
      router.push("/groups");
    } catch (e: any) {
      setMsg(e.message ?? "脱退に失敗しました（オーナーは脱退できません）");
    }
  };

  const deleteGroup = async () => {
    if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;
    const { error } = await supabase.from("groups").delete().eq("id", gid);
    if (error) return setMsg(error.message);
    setMsg("グループを削除しました");
    router.push("/groups");
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h5">{name}</Typography>
            <Stack direction="row" spacing={1}>
              <Button onClick={() => history.back()}>戻る</Button>
              {isAdmin && (
                <Button variant="outlined" color="error" onClick={deleteGroup}>
                  グループを削除
                </Button>
              )}
            </Stack>
          </Stack>

          {/* 招待リンク */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  招待
                </Typography>
                {inviteToken ? (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                  >
                    <TextField
                      value={inviteLink ?? ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                    <Button
                      onClick={copyInvite}
                      startIcon={<ContentCopyIcon />}
                    >
                      コピー
                    </Button>
                    {isAdmin && (
                      <Button variant="outlined" onClick={regenerateInvite}>
                        再発行
                      </Button>
                    )}
                  </Stack>
                ) : isAdmin ? (
                  <Button variant="outlined" onClick={regenerateInvite}>
                    招待リンクを発行
                  </Button>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    招待リンクは管理者のみ表示できます
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  共有URLは <code>/g/&lt;token&gt;</code>{" "}
                  です。踏むだけで参加できます（要ログイン）。
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* メンバー一覧 */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                メンバー
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={1}>
                {members.map((m) => (
                  <Stack
                    key={m.user_id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={m.avatar_url ?? undefined} />
                      <Stack>
                        <Typography variant="body2">
                          {m.display_name ?? m.username ?? "ユーザー"}
                        </Typography>
                        {m.username && (
                          <Typography variant="caption" color="text.secondary">
                            @{m.username}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                    <Chip size="small" label={m.role} />
                  </Stack>
                ))}
                {members.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    メンバーはいません
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* ===== グループ限定記事 一覧 ===== */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  このグループの投稿（グループ限定）
                </Typography>
                {postsTotal > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    全{postsTotal}件
                  </Typography>
                )}
              </Stack>

              {postsLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : !posts || posts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  表示できる記事がありません
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {posts.map((p) => (
                    <Card key={p.id} variant="outlined">
                      <CardActionArea href={`/posts/${p.slug}`}>
                        <CardContent>
                          <Typography variant="subtitle1">{p.title}</Typography>
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
                            {p.published_at && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ・
                                {new Date(p.published_at).toLocaleDateString()}
                              </Typography>
                            )}
                            {p.read_minutes != null && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ・{p.read_minutes}分
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}

                  <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
                    <Pagination
                      page={postPage}
                      onChange={(_, p) => setPostPage(p)}
                      count={Math.max(
                        1,
                        Math.ceil(postsTotal / POSTS_PER_PAGE)
                      )}
                      color="primary"
                    />
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* 自分の操作 */}
          <Stack direction="row" spacing={1}>
            <Button onClick={() => router.push("/groups")}>
              グループ一覧へ
            </Button>
            <Button color="warning" variant="outlined" onClick={leaveGroup}>
              このグループを脱退
            </Button>
          </Stack>
        </>
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
