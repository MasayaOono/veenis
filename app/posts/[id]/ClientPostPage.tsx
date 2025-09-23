"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase";
import {
  Box,
  Typography,
  Divider,
  Paper,
  IconButton,
  Alert,
  Avatar,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import Script from "next/script";
import { buildToc, toId } from "@/utils/toc";
import ContentColumn from "@/app/_components/ContentColumn";
import Comments from "./Comments";

type PostRow = {
  id: string;
  title: string;
  body_md: string;
  author_id: string;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  visibility: "draft" | "public" | "group" | "link";
};

export default function ClientPostPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const token = params.get("token") || undefined;

  const [post, setPost] = useState<PostRow | null>(null);
  const [author, setAuthor] = useState<{
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null>(null);

  const [me, setMe] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 共有UI
  const [shareEl, setShareEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareEl);
  const openShare = (e: React.MouseEvent<HTMLElement>) =>
    setShareEl(e.currentTarget);
  const closeShare = () => setShareEl(null);

  // 削除UI
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (!post) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/posts/${encodeURIComponent(post.id)}${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
  }, [post, token]);

  const copyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast("リンクをコピーしました");
    } catch {
      setToast("コピーに失敗しました");
    } finally {
      closeShare();
    }
  }, [shareUrl]);

  const webShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title ?? "記事",
          text: post?.title ?? "",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setToast("リンクをコピーしました");
      }
    } catch {
      /* noop */
    } finally {
      closeShare();
    }
  }, [post?.title, shareUrl]);

  const openX = useCallback(() => {
    const text = encodeURIComponent(post?.title ?? "");
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
    closeShare();
  }, [post?.title, shareUrl]);

  // 投稿ロード
  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("IDが不正です");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      let data: PostRow | null = null;

      if (token) {
        const r = await supabase.rpc("get_post_by_token_by_id", {
          p_post_id: id,
          p_token: token,
        });
        if (!r.error && r.data) data = r.data as PostRow;
      } else {
        const r = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .maybeSingle<PostRow>();
        if (!r.error) data = r.data ?? null;
      }

      if (!data) {
        setPost(null);
        setLoading(false);
        return;
      }

      setPost(data);

      // 著者プロフィール
      {
        const { data: prof } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("user_id", data.author_id)
          .maybeSingle();
        setAuthor(prof ?? null);
      }

      // 自分の情報（いいね状態、フォロー状態、所有者判定）
      const { data: meRes } = await supabase.auth.getUser();
      const myId = meRes.user?.id ?? null;
      setMe(myId);
      setIsOwner(!!myId && myId === data.author_id);

      if (myId) {
        const mine = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("post_id", data.id)
          .eq("user_id", myId)
          .maybeSingle();
        setLiked(!!mine.data);

        if (myId !== data.author_id) {
          const f = await supabase
            .from("follows")
            .select("followee_id")
            .eq("follower_id", myId)
            .eq("followee_id", data.author_id)
            .maybeSingle();
          setIsFollowing(!!f.data);
        }
      } else {
        setLiked(false);
        setIsFollowing(false);
      }

      // いいね数
      {
        const likeRes = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", data.id);
        setLikeCount(likeRes.count ?? 0);
      }

      setLoading(false);
    };

    load();
  }, [id, token, supabase]);

  const toc = useMemo(() => buildToc(post?.body_md ?? ""), [post?.body_md]);

  // いいね（楽観更新）
  const toggleLike = useCallback(async () => {
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid || !post?.id) return;

    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: uid });
      if (error) {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    } else {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", uid);
      if (error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  }, [liked, post?.id, supabase]);

  // フォロー（楽観更新）
  const toggleFollow = useCallback(async () => {
    if (!me || !post?.author_id || me === post.author_id) return;
    if (!isFollowing) {
      setIsFollowing(true);
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: me, followee_id: post.author_id });
      if (error) setIsFollowing(false);
    } else {
      setIsFollowing(false);
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", me)
        .eq("followee_id", post.author_id);
      if (error) setIsFollowing(true);
    }
  }, [me, post?.author_id, isFollowing, supabase]);

  // 削除
  const handleDelete = useCallback(async () => {
    if (!post?.id) return;
    setBusyDelete(true);
    try {
      const rpc = await supabase.rpc("delete_post_cascade", {
        p_post_id: post.id,
      });
      if (rpc.error && !/function .* does not exist/i.test(rpc.error.message)) {
        throw rpc.error;
      }
      if (rpc.error) {
        const del = await supabase.from("posts").delete().eq("id", post.id);
        if (del.error) throw del.error;
      }
      setToast("記事を削除しました。");
      router.replace("/me");
    } catch (e: any) {
      setToast(e?.message ?? "削除に失敗しました。");
    } finally {
      setBusyDelete(false);
      setConfirmOpen(false);
    }
  }, [post?.id, router, supabase]);

  if (loading) return <Typography>読み込み中...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!post) {
    return (
      <Alert severity="warning">
        記事が見つからないか、閲覧権限がありません。
        {token ? null : (
          <>
            （リンク限定記事は <code>?token=…</code> が必要）
          </>
        )}
      </Alert>
    );
  }

  // 構造化データ
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: (post.body_md || "").replace(/\n+/g, " ").slice(0, 160),
    author: {
      "@type": "Person",
      name: author?.display_name || author?.username || "Unknown",
    },
    image: post.cover_image_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":
        typeof window !== "undefined"
          ? `${window.location.origin}/posts/${encodeURIComponent(post.id)}${
              token ? `?token=${encodeURIComponent(token)}` : ""
            }`
          : "",
    },
  };

  return (
    <Box sx={{ position: "relative", display: "flex", gap: 3 }}>
      {/* 本文 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ContentColumn maxWidth={760}>
          {/* ===== タイトル＆アクション（XS/SMは縦、MD+は右上） ===== */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gridTemplateAreas: {
                xs: `"title" "actions"`,
                md: `"title actions"`,
              },
              alignItems: { md: "center" },
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              sx={{ mb: { xs: 0.5, md: 0 }, gridArea: "title" }}
            >
              {post.title}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{
                gridArea: "actions",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                "& .MuiButton-root": { whiteSpace: "nowrap" },
              }}
            >
              <Button
                startIcon={<ShareIcon />}
                variant="outlined"
                size="small"
                onClick={openShare}
              >
                共有
              </Button>
              <Menu anchorEl={shareEl} open={shareOpen} onClose={closeShare}>
                <MenuItem onClick={webShare}>
                  <ListItemIcon>
                    <ShareIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="共有（Web Share / クリップボード）" />
                </MenuItem>
                <MenuItem onClick={copyShareUrl}>
                  <ListItemIcon>
                    <ContentCopyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="リンクをコピー" />
                </MenuItem>
                <MenuItem onClick={openX}>
                  <ListItemIcon>
                    <OpenInNewIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="X（旧Twitter）で共有" />
                </MenuItem>
              </Menu>

              {isOwner && (
                <>
                  <Button
                    component={NextLink}
                    href={`/posts/${encodeURIComponent(post.id)}/edit${
                      token ? `?token=${encodeURIComponent(token)}` : ""
                    }`}
                    variant="outlined"
                    size="small"
                  >
                    編集
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    size="small"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => setConfirmOpen(true)}
                  >
                    削除
                  </Button>
                </>
              )}
            </Stack>
          </Box>

          {/* 著者情報 + フォロー */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}
          >
            <Avatar
              src={author?.avatar_url ?? undefined}
              sx={{ width: 28, height: 28 }}
            >
              {author?.display_name?.charAt(0) ??
                author?.username?.charAt(0) ??
                "U"}
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {author?.display_name || author?.username || "Unknown"}
            </Typography>

            {!isOwner && (
              <Button
                size="small"
                variant={isFollowing ? "outlined" : "contained"}
                onClick={toggleFollow}
                disabled={!me}
                sx={{ textTransform: "none", py: 0.25 }}
              >
                {isFollowing ? "フォロー中" : "フォロー"}
              </Button>
            )}
          </Stack>

          {/* いいね */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconButton
              onClick={toggleLike}
              color={liked ? "error" : "default"}
              aria-label="like"
            >
              {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2">{likeCount}</Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 本文 */}
          <Box
            className="article-body"
            sx={{ "& h1, & h2, & h3": { scrollMarginTop: 96 } }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                h1({ node, ...props }) {
                  return <h1 id={toId(String(props.children))} {...props} />;
                },
                h2({ node, ...props }) {
                  return <h2 id={toId(String(props.children))} {...props} />;
                },
                h3({ node, ...props }) {
                  return <h3 id={toId(String(props.children))} {...props} />;
                },
              }}
            >
              {post.body_md}
            </ReactMarkdown>
          </Box>

          {/* 構造化データ */}
          <Script id="ld-article" type="application/ld+json">
            {JSON.stringify(ldJson)}
          </Script>

          {/* コメント */}
          <Comments postId={id} />
        </ContentColumn>
      </Box>

      {/* 右サイド：目次 */}
      <Box
        sx={{
          width: 260,
          position: "sticky",
          top: 88,
          alignSelf: "flex-start",
          display: { xs: "none", md: "block" },
        }}
      >
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            目次
          </Typography>
          {toc.map((item: any) => (
            <Typography
              key={item.id}
              variant="body2"
              sx={{ ml: item.level === 2 ? 2 : 0, mb: 0.5 }}
            >
              <a href={`#${item.id}`}>{item.text}</a>
            </Typography>
          ))}
        </Paper>
      </Box>

      {/* 削除ダイアログ */}
      <Dialog
        open={confirmOpen}
        onClose={() => !busyDelete && setConfirmOpen(false)}
      >
        <DialogTitle>記事を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この操作は元に戻せません。記事本文・メタ情報は削除されます。
            （いいね/タグ等はDBの設定により併せて削除・無効化されます）
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={busyDelete}>
            キャンセル
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={busyDelete}
          >
            {busyDelete ? "削除中…" : "削除する"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* トースト */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast ?? ""}
      />
    </Box>
  );
}
