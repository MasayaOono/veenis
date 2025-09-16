// app/posts/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
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

export default function PostsIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL → ソートのみ採用
  const sortParam = (params.get("sort") === "popular" ? "popular" : "new") as
    | "new"
    | "popular";

  // 表示データ
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  /* ---------- URL更新（ソートのみ） ---------- */
  const pushSort = useCallback(
    (sort: "new" | "popular") => {
      const usp = new URLSearchParams();
      if (sort !== "new") usp.set("sort", sort); // 既定値は省略
      const next = `${pathname}?${usp.toString()}`;
      const current = `${pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      if (next === current) return;
      router.push(next);
    },
    [pathname, params, router]
  );

  /* ---------- データ読み込み（検索/タグなし） ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase.rpc("list_posts", {
        p_q: null, // 検索廃止
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

  /* ---------- ハンドラ ---------- */
  const handleSort = (_: any, v: "new" | "popular" | null) => {
    if (!v || v === sortParam) return;
    pushSort(v);
  };

  return (
    <Box sx={{ mx: "auto", px: 2, py: 3 }}>
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

      {/* 結果一覧 */}
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
