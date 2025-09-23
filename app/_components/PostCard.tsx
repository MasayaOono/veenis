"use client";
import {
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  Avatar,
  Typography,
  Link,
  Stack,
  Box,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import NextLink from "next/link";
import { getPlaceholderCoverDataUrl } from "@/utils/placeholderCover";

export default function PostCard({
  id,
  title,
  cover_image_url,
  likeCount,
  author,
}: {
  id?: string;
  title: string;
  cover_image_url?: string | null;
  likeCount?: number;
  author?: {
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };
}) {
  const image = cover_image_url || getPlaceholderCoverDataUrl(title);
  const userHref = author?.username ? `/users/${author.username}` : undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative", // ← オーバーレイリンク用
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        transition: "transform .05s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      {/* 全面オーバーレイのリンク（カード全体クリックで遷移） */}
      <Box
        component={NextLink}
        href={`/posts/${id}`}
        aria-label={`記事「${title}」へ移動`}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          borderRadius: 2,
          // フォーカス可視化
          outline: "none",
          "&:focus-visible": (t) => ({
            boxShadow: `0 0 0 2px ${t.palette.primary.main} inset`,
          }),
        }}
      >
        {/* アンカーの子要素は必要なので空spanを置く */}
        <span aria-hidden="true" />
      </Box>

      {/* サムネ（3:2、プレースホルダー対応） */}
      <CardMedia
        component="img"
        src={image}
        alt={title}
        loading="lazy"
        sx={{
          aspectRatio: "3 / 2",
          width: "100%",
          height: "auto",
          objectFit: "cover",
          display: "block",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      />

      <CardHeader
        avatar={
          userHref ? (
            <Link
              component={NextLink}
              href={userHref}
              underline="none"
              sx={{ display: "inline-flex", position: "relative", zIndex: 2 }} // ← 前面に
              aria-label={`${
                author?.display_name ?? author?.username ?? "ユーザー"
              }のプロフィールへ`}
            >
              <Avatar
                src={author?.avatar_url ?? undefined}
                alt={author?.display_name ?? author?.username ?? undefined}
                sx={{ width: 32, height: 32 }}
              />
            </Link>
          ) : (
            <Avatar
              src={author?.avatar_url ?? undefined}
              alt={author?.display_name ?? author?.username ?? undefined}
              sx={{ width: 32, height: 32, position: "relative", zIndex: 2 }}
            />
          )
        }
        // タイトルはテキストだけ（リンクはカード全体に任せる）
        title={
          <Typography
            component="div"
            variant="subtitle1"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontWeight: 700,
              lineHeight: 1.3,
              position: "relative",
              zIndex: 2, // ← 前面に（選択可 & クリック時はカード遷移）
            }}
          >
            {title}
          </Typography>
        }
        subheader={
          userHref ? (
            <Link
              component={NextLink}
              href={userHref}
              underline="hover"
              color="inherit"
              aria-label={`${
                author?.display_name ?? author?.username ?? "ユーザー"
              }のプロフィールへ`}
              sx={{ position: "relative", zIndex: 2 }}
            >
              {author?.display_name ?? author?.username ?? "Unknown"}
            </Link>
          ) : (
            <span style={{ position: "relative", zIndex: 2 }}>
              {author?.display_name ?? author?.username ?? "Unknown"}
            </span>
          )
        }
        sx={{ pb: 0 }}
      />

      <CardContent sx={{ mt: "auto", pt: 1.5 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ position: "relative", zIndex: 2 }}
        >
          <Typography
            variant="caption"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <FavoriteIcon fontSize="inherit" /> {likeCount ?? 0}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
