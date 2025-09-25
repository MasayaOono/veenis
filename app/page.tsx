// app/posts/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { createClient } from "@/lib/supabase";

type FeedPost = {
  id: string;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  like_count: number;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
};

const LIMIT = 40;

/* ---------------- イントロ（毎回） ---------------- */
function AppIntro() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);


  
  // 初回訪問のみ表示（localStorage フラグ）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("veenis_intro_seen");
    if (!seen) setOpen(true);
  }, []);

  const closeAndRemember = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("veenis_intro_seen", "1");
    }
    setOpen(false);
  }, []);

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
    backgroundImage:
      theme.palette.mode === "dark"
        ? "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))"
        : "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))",
  } as const;

  return (
    <Dialog
      open={open}
      onClose={closeAndRemember}
      fullWidth
      maxWidth="sm"
      aria-labelledby="veenis-intro-title"
      transitionDuration={{ enter: 250, exit: 200 }}
      PaperProps={{ sx: paperStyles }}
    >
      {/* ロゴ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: { xs: 0.5, sm: 1 }, mb: 0.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 2,
            background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
            boxShadow: "0 4px 16px rgba(6,182,212,0.35)",
          }}
        />
        <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.9 }}>
          VEENIS
        </Typography>
      </Box>

      <DialogTitle id="veenis-intro-title" sx={{ fontWeight: 800, lineHeight: 1.2, px: 0, pt: 0, pb: 0.5 }}>
        現場知見を、みんなの力で磨こう。
      </DialogTitle>

      <DialogContent dividers sx={{ px: 0, border: "none" }}>
        <Typography sx={{ mb: 2, opacity: 0.9 }}>
          Veenis は、美容の<b>学生さん・アシスタント・若手〜ベテラン</b>まで、<br/>
          「施術設計・運用ノウハウ」を
          <b>書く／集める／共有する</b>ための<br/>ワークスペースです。
        </Typography>

        <Stack spacing={1.25} sx={{ mb: 2 }}>
          <FeatureChip label="書く" text="テンプレから素早く書き出し。短くてもOK、まず一歩。" />
          <FeatureChip label="集める" text="タグで整理。自分だけの“辞書”として後から使える。" />
          <FeatureChip label="共有" text="完全公開 or グループ限定を選べます。" />
        </Stack>

        {/* スタートガイド（やってみたくなる導線） */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            まずは 5 分だけ、やってみましょう！
          </Typography>
          <Stack spacing={0.75}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              1) ログインして「記事作成」 → 気になるテンプレを1つ選ぶ
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              2) 今日の学び／施術の気づきを3行だけメモ
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              3) 公開範囲（公開 or グループ）を選んで保存
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            ※ 記事の作成にはログインが必要です。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 0, pt: 2, gap: 1 }}>
        <Button component={NextLink} href="/about" color="inherit" sx={{ opacity: 0.9 }} onClick={closeAndRemember}>
          記事を見てみる
        </Button>
        <Button
          component={NextLink}
          href="/auth/login?next=/posts/new"
          onClick={closeAndRemember}
          variant="contained"
          sx={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)" }}
        >
          ログインしてはじめる
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** 小さな表示部品：左がチップ、右が説明 */
function FeatureChip({ label, text }: { label: string; text: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        label={label}
        sx={{ bgcolor: "transparent", border: "1px solid", borderColor: "primary.main" }}
      />
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {text}
      </Typography>
    </Stack>
  );
}

/* ---------------- 一覧（新着 / 人気） ---------------- */
export default function PostsIndexPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

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
      const q = usp.toString();
      const next = `${pathname}${q ? `?${q}` : ""}`; // ← 余分な ? を出さない
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
        p_q: null, // 検索なし
        p_sort: sortParam, // 'new' | 'popular'
        p_limit: LIMIT,
        p_offset: 0,
      });
      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setItems([]);
      } else {
        const rows: FeedPost[] = (data ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug ?? null,
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
  }, [sortParam, supabase]);

  const handleSort = (_: any, v: "new" | "popular" | null) => {
    if (!v || v === sortParam) return;
    pushSort(v);
  };

  return (
    <Box sx={{ mx: "auto", px: 2, py: 3 }}>
      {/* イントロ（毎回） */}
      <AppIntro />

      {/* ソート切替 */}
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
              id={p.id}
              title={p.title}
              cover_image_url={p.cover_image_url}
              likeCount={p.like_count}
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
