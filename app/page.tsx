// app/posts/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  useTheme,
} from "@mui/material";
import PostCard from "@/app/_components/PostCard";
import { supabase } from "@/lib/supabaseClient";

type FeedPost = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  like_count: number;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
};

const LIMIT = 40;

/* ---------------- いつも出す（見た目リッチな）イントロ ---------------- */
function AppIntro() {
  const theme = useTheme();
  const [open, setOpen] = useState(true); // ← 毎回表示

  // ガラス感・透明感（ライト/ダーク両対応）
  const paperStyles = {
    px: { xs: 2, sm: 3 },
    py: { xs: 2, sm: 2.5 },
    borderRadius: 4,
    bgcolor:
      theme.palette.mode === "dark"
        ? "rgba(18,18,20,0.55)"
        : "rgba(255,255,255,0.6)",
    backdropFilter: "blur(16px) saturate(140%)",
    WebkitBackdropFilter: "blur(16px) saturate(140%)",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 10px 30px rgba(0,0,0,0.45)"
        : "0 10px 30px rgba(0,0,0,0.15)",
    // うっすらグラデ
    backgroundImage:
      theme.palette.mode === "dark"
        ? "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))"
        : "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))",
  } as const;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      aria-labelledby="veenis-intro-title"
      transitionDuration={{ enter: 250, exit: 200 }}
      PaperProps={{ sx: paperStyles }}
    >
      {/* トップのロゴ/バッジ */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mt: { xs: 0.5, sm: 1 },
          mb: 0.5,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 2,
            background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
            boxShadow: "0 4px 16px rgba(6,182,212,0.35)",
          }}
        />
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.2, opacity: 0.9 }}
        >
          VEENIS
        </Typography>
      </Box>

      <DialogTitle
        id="veenis-intro-title"
        sx={{
          fontWeight: 800,
          lineHeight: 1.2,
          px: 0,
          pt: 0,
          pb: 0.5,
        }}
      >
        現場知見を、美しく整える。
      </DialogTitle>

      <DialogContent dividers sx={{ px: 0, border: "none" }}>
        <Typography sx={{ mb: 2, opacity: 0.9 }}>
          Veenisは、美容のプロが「施術設計・運用ノウハウ」を
          <b>書く／集める／共有する</b>ためのワークスペースです。
        </Typography>

        <Stack spacing={1.25} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label="書く"
              sx={{
                bgcolor: "transparent",
                border: "1px solid",
                borderColor: "primary.main",
              }}
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ブリーチ設計・矯正プロトコル・カウンセリング雛形をテンプレから素早く作成
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label="集める"
              sx={{
                bgcolor: "transparent",
                border: "1px solid",
                borderColor: "primary.main",
              }}
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              タグや公開範囲で整理し、自分の“辞書”として再利用
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label="共有"
              sx={{
                bgcolor: "transparent",
                border: "1px solid",
                borderColor: "primary.main",
              }}
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              公開／リンク限定／グループ限定を選べます
            </Typography>
          </Stack>
        </Stack>

        {/* うっすらガイドカード */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            はじめの一歩
          </Typography>
          <Stack spacing={0.75}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              1) 右上「記事作成」からテンプレを選び、要点だけ埋める
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              2) タグと公開範囲を設定して保存（リンク限定が便利）
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              3) 画像は保存時に自動アップロード
            </Typography>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 0, pt: 2 }}>
        <Button
          component={NextLink}
          href="/about"
          color="inherit"
          sx={{ opacity: 0.9 }}
          onClick={() => setOpen(false)}
        >
          詳しい使い方
        </Button>
        <Button
          onClick={() => setOpen(false)}
          variant="contained"
          sx={{
            background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
          }}
        >
          はじめる
        </Button>
      </DialogActions>
    </Dialog>
  );
}
/* ----------------------------------------------------------- */

export default function PostsIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL → ソートのみ採用
  const sortParam = (params.get("sort") === "popular" ? "popular" : "new") as
    | "new"
    | "popular";

  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const pushSort = useCallback(
    (sort: "new" | "popular") => {
      const usp = new URLSearchParams();
      if (sort !== "new") usp.set("sort", sort);
      const next = `${pathname}?${usp.toString()}`;
      const current = `${pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      if (next === current) return;
      router.push(next);
    },
    [pathname, params, router]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase.rpc("list_posts", {
        p_q: null,
        p_sort: sortParam,
        p_limit: LIMIT,
        p_offset: 0,
      });
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setItems([]);
      } else {
        const rows = (data ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          cover_image_url: r.cover_image_url ?? null,
          like_count: r.like_count ?? 0,
          author_username: r.author_username ?? null,
          author_display_name: r.author_display_name ?? null,
          author_avatar_url: r.author_avatar_url ?? null,
        }));
        setItems(rows);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sortParam]);

  const handleSort = (_: any, v: "new" | "popular" | null) => {
    if (!v || v === sortParam) return;
    pushSort(v);
  };

  return (
    <Box sx={{ mx: "auto", px: 2, py: 3 }}>
      {/* おしゃれ透明イントロ（毎回表示） */}
      <AppIntro />

      {/* ソートのみ */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
      >
        <ToggleButtonGroup
          value={sortParam}
          exclusive
          onChange={handleSort}
          size="small"
          aria-label="sort"
        >
          <ToggleButton value="new" aria-label="newest">
            新着
          </ToggleButton>
          <ToggleButton value="popular" aria-label="popular">
            人気
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : err ? (
        <Alert severity="error">読み込みエラー: {err}</Alert>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">
          該当する記事はありません。
        </Typography>
      ) : (
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
          {items.map((p) => (
            <PostCard
              key={p.id}
              title={p.title}
              slug={p.slug}
              cover_image_url={p.cover_image_url}
              likeCount={p.like_count ?? 0}
              author={{
                username: p.author_username,
                display_name: p.author_display_name,
                avatar_url: p.author_avatar_url,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
