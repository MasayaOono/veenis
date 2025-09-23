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
  Tooltip,
  alpha,
} from "@mui/material";
import Link from "next/link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ShieldIcon from "@mui/icons-material/Shield";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import LinkIcon from "@mui/icons-material/Link";
import { createClient } from "@/lib/supabase";

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
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gid = id as string;

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [myRole, setMyRole] = useState<"owner" | "admin" | "member" | null>(
    null
  );
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
          .select("id, name, invite_token, owner_id")
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

        // 自分のロール
        const { data: me } = await supabase.auth.getUser();
        const uid = me.user?.id || null;
        const mine =
          (gm ?? []).find((m: any) => m.user_id === uid)?.role ?? null;
        if (!cancelled) setMyRole(mine ?? null);

        // プロフィールまとめ取得
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
            read_minutes: r.read_minutes ?? null,
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
    if (myRole === "owner") {
      setMsg("オーナーは脱退できません。先にグループを削除してください。");
      return;
    }
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
      setMsg(e.message ?? "脱退に失敗しました");
    }
  };

  // ← 重要：直接DELETEせず RPC で削除（RLS/トリガを安全に通過）
  const deleteGroup = async () => {
    if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;
    try {
      const { data, error } = await supabase.rpc("admin_delete_group", {
        p_group_id: gid,
      });
      if (error) throw error;
      setMsg("グループを削除しました");
      router.push("/groups");
    } catch (e: any) {
      setMsg(e.message ?? "削除に失敗しました");
    }
  };

  const section = (title: string, icon: React.ReactNode) => (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          display: "grid",
          placeItems: "center",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          color: "primary.main",
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", px: 2, py: 3 }}>
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ヘッダー */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <GroupIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {name}
              </Typography>
              {myRole && (
                <Chip
                  size="small"
                  label={myRole}
                  color={
                    myRole === "owner"
                      ? "primary"
                      : myRole === "admin"
                      ? "secondary"
                      : "default"
                  }
                  sx={{ textTransform: "capitalize" }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button onClick={() => history.back()}>戻る</Button>
              {isAdmin && (
                <Tooltip title="グループを完全削除（記事やメンバーは影響しませんが、参加関係は解除されます）">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={deleteGroup}
                    startIcon={<DeleteForeverIcon />}
                  >
                    グループを削除
                  </Button>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* 招待リンク */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              {section("招待", <LinkIcon fontSize="small" />)}
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
                  <Button onClick={copyInvite} startIcon={<ContentCopyIcon />}>
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
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                共有URLは <code>/g/&lt;token&gt;</code>{" "}
                です。踏むだけで参加できます（要ログイン）。
              </Typography>
            </CardContent>
          </Card>

          {/* メンバー一覧 */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              {section("メンバー", <VerifiedUserIcon fontSize="small" />)}
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
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Avatar src={m.avatar_url ?? undefined} />
                      <Stack sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {m.display_name ?? m.username ?? "ユーザー"}
                        </Typography>
                        {m.username && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            @{m.username}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                    <Chip
                      size="small"
                      icon={m.role === "owner" ? <ShieldIcon /> : undefined}
                      label={m.role}
                      sx={{ textTransform: "capitalize" }}
                      color={
                        m.role === "owner"
                          ? "primary"
                          : m.role === "admin"
                          ? "secondary"
                          : "default"
                      }
                    />
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

          {/* グループ限定記事 */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              {section(
                "このグループの投稿（グループ限定）",
                <ArticleIcon fontSize="small" />
              )}
              {postsTotal > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  全{postsTotal}件
                </Typography>
              )}

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
                    <Card
                      key={p.id}
                      variant="outlined"
                      sx={{ overflow: "hidden" }}
                    >
                      <CardActionArea component={Link} href={`/posts/${p.id}`}>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            {p.title}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.75, flexWrap: "wrap" }}
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
            <Tooltip
              title={
                myRole === "owner"
                  ? "オーナーは脱退できません（削除してください）"
                  : ""
              }
            >
              <span>
                <Button
                  color="warning"
                  variant="outlined"
                  onClick={leaveGroup}
                  startIcon={<LogoutIcon />}
                  disabled={myRole === "owner"}
                >
                  このグループを脱退
                </Button>
              </span>
            </Tooltip>
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
