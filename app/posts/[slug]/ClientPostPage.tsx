"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { supabase } from "@/lib/supabaseClient";
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
import { buildSlugVariants } from "@/utils/slugVariants";
import ContentColumn from "@/app/_components/ContentColumn";

type PostRow = any;

export default function ClientPostPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const token = params.get("token");

  const [post, setPost] = useState<PostRow | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<{
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // 削除UI
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 共有UI
  const [shareEl, setShareEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareEl);
  const openShare = (e: React.MouseEvent<HTMLElement>) =>
    setShareEl(e.currentTarget);
  const closeShare = () => setShareEl(null);

  const shareUrl = useMemo(() => {
    if (!post) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/posts/${encodeURIComponent(post.slug)}${
      token ? `?token=${token}` : ""
    }`;
  }, [post, token]);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast("リンクをコピーしました");
    } catch {
      setToast("コピーに失敗しました");
    } finally {
      closeShare();
    }
  };
  const doWebShare = async () => {
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
  };
  const openX = () => {
    const text = encodeURIComponent(post?.title ?? "");
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
    closeShare();
  };

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);

      const variants = buildSlugVariants(slug);
      let data: PostRow | null = null;

      if (token) {
        for (const v of variants) {
          const r = await supabase.rpc("get_post_by_token", {
            p_slug: v,
            p_token: token,
          });
          if (!r.error && r.data) {
            data = r.data;
            break;
          }
        }
      } else {
        const r = await supabase
          .from("posts")
          .select("*")
          .in("slug", variants)
          .maybeSingle();
        if (!r.error) data = r.data;
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

      // いいね数
      {
        const likeRes = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", data.id);
        setLikeCount(likeRes.count ?? 0);
      }

      // 自分のいいね / 自分の投稿か判定
      {
        const { data: me } = await supabase.auth.getUser();
        const myId = me.user?.id;
        if (myId) {
          const { data: mine } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq("post_id", data.id)
            .eq("user_id", myId)
            .maybeSingle();
          setLiked(!!mine);
          setIsOwner(myId === data.author_id);
        } else {
          setLiked(false);
          setIsOwner(false);
        }
      }

      setLoading(false);
    };
    load();
  }, [slug, token]);

  const toc = useMemo(() => buildToc(post?.body_md ?? ""), [post?.body_md]);

  const toggleLike = async () => {
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid || !post?.id) return;
    if (!liked) {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: uid });
      if (!error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", uid);
      if (!error) {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    }
  };

  // 削除実行
  const handleDelete = async () => {
    if (!post?.id) return;
    setBusyDelete(true);
    try {
      const rpc = await supabase.rpc("delete_post_cascade", {
        p_post_id: post.id,
      });
      if (rpc.error && !/function .* does not exist/i.test(rpc.error.message)) {
        throw rpc.error;
      }
      if (!rpc.error) {
        setToast("記事を削除しました。");
      } else {
        const del = await supabase.from("posts").delete().eq("id", post.id);
        if (del.error) throw del.error;
        setToast("記事を削除しました。");
      }
      router.replace("/me");
    } catch (e: any) {
      setToast(e?.message ?? "削除に失敗しました。");
    } finally {
      setBusyDelete(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <Typography>読み込み中...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!post) {
    return (
      <Alert severity="warning">
        記事が見つからないか、閲覧権限がありません。
        {token ? null : (
          <>
            （リンク限定記事の場合は <code>?token=...</code> が必要です）
          </>
        )}
      </Alert>
    );
  }

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
          ? `${window.location.origin}/posts/${encodeURIComponent(post.slug)}${
              token ? `?token=${token}` : ""
            }`
          : "",
    },
  };

  return (
    <Box sx={{ position: "relative", display: "flex", gap: 3 }}>
      {/* 本文（入力と同じ横幅でセンタリング） */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ContentColumn maxWidth={760}>
          {/* タイトル + 右側アクション */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 1 }}
          >
            <Typography variant="h3" gutterBottom sx={{ mb: 0 }}>
              {post.title}
            </Typography>

            <Stack direction="row" spacing={1}>
              {/* 共有ボタン：誰でも使える */}
              <Button
                startIcon={<ShareIcon />}
                variant="outlined"
                size="small"
                onClick={openShare}
              >
                共有
              </Button>
              <Menu anchorEl={shareEl} open={shareOpen} onClose={closeShare}>
                <MenuItem onClick={doWebShare}>
                  <ListItemIcon>
                    <ShareIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="共有（Web Share / クリップボード）" />
                </MenuItem>
                <MenuItem onClick={doCopy}>
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

              {/* 表示・編集・削除はオーナーのみ */}
              {isOwner && (
                <>
                  <Button
                    component={NextLink}
                    href={`/posts/${encodeURIComponent(post.slug)}`}
                    variant="outlined"
                    size="small"
                  >
                    表示へ戻る
                  </Button>
                  <Button
                    component={NextLink}
                    href={`/posts/${encodeURIComponent(post.slug)}/edit${
                      token ? `?token=${token}` : ""
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
          </Stack>

          {/* 著者情報 */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Avatar
              src={author?.avatar_url ?? undefined}
              sx={{ width: 28, height: 28 }}
            >
              {author?.display_name?.charAt(0) ??
                author?.username?.charAt(0) ??
                "U"}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {author?.display_name || author?.username || "Unknown"}
            </Typography>
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

          {/* JSON-LD（構造化データ） */}
          <Script id="ld-article" type="application/ld+json">
            {JSON.stringify(ldJson)}
          </Script>
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
