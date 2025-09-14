"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
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
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { buildToc, toId } from "@/utils/toc";
import { buildSlugVariants } from "@/utils/slugVariants";
import ContentColumn from "@/app/_components/ContentColumn";

type PostRow = any;

export default function PostDetailPage() {
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

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);

      const variants = buildSlugVariants(slug);
      let data: PostRow | null = null;

      if (token) {
        // リンク限定（token必須）
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
        // 通常表示（RLSにより、公開/所属グループのみ可視）
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

  // ショートカット: E で編集（本人のみ）
  useEffect(() => {
    if (!isOwner || !post?.slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        window.location.href = `/posts/${encodeURIComponent(post.slug)}/edit${
          token ? `?token=${token}` : ""
        }`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOwner, post?.slug, token]);

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

  return (
    <Box sx={{ position: "relative", display: "flex", gap: 3 }}>
      {/* 本文（入力と同じ横幅でセンタリング） */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ContentColumn maxWidth={760}>
          {/* タイトル + 編集導線 */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 1 }}
          >
            <Typography variant="h3" gutterBottom sx={{ mb: 0 }}>
              {post.title}
            </Typography>

            {isOwner && (
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
            )}
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
          {toc.map((item) => (
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
    </Box>
  );
}
