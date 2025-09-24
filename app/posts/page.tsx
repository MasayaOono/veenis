// app/posts/page.tsx
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Divider,
  Button,
  Autocomplete,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import PostCard from "@/app/_components/PostCard";
import { createClient } from "@/lib/supabase";

type FeedPost = {
  id: string;
  title: string;
  slug?: string;
  cover_image_url: string | null;
  like_count: number;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
};
type TagAgg = { name: string; cnt: number };

const LIMIT = 24;
const PRESET_CATEGORIES = [
  "カット",
  "カラー",
  "パーマ",
  "トリートメント",
  "ヘッドスパ",
  "ネイル",
  "アイラッシュ",
  "スキンケア",
  "エステ",
];

function parseTagsParam(p: string | null): string[] {
  if (!p) return [];
  return p
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function toTagsParam(tags: string[]): string | null {
  const uniq = [...new Set(tags.map((s) => s.trim()).filter(Boolean))];
  return uniq.length ? uniq.join(",") : null;
}
function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export default function PostsIndexPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL -> 条件
  const qParamRaw = (params.get("q") || "").trim();
  const sortParam = (params.get("sort") === "popular" ? "popular" : "new") as
    | "new"
    | "popular";
  const tagsParam = parseTagsParam(params.get("tags"));
  const pageParam = Math.max(1, Number(params.get("page") || 1));

  // UI state
  const [query, setQuery] = useState(qParamRaw);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagsParam);

  // データ表示
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);

  // 候補
  const [myTags, setMyTags] = useState<string[] | null>(null);
  const [popularTags, setPopularTags] = useState<TagAgg[] | null>(null);

  // 空打ち防止
  const canSearch = qParamRaw.length >= 2 || selectedTags.length > 0;

  /* URL→state 同期 */
  useEffect(() => {
    if (query !== qParamRaw) setQuery(qParamRaw);
  }, [qParamRaw]); // eslint-disable-line
  useEffect(() => {
    if (!arraysEqual(selectedTags, tagsParam)) setSelectedTags(tagsParam);
  }, [params.get("tags")]); // eslint-disable-line
  useEffect(() => {
    if (page !== pageParam) setPage(pageParam);
  }, [pageParam]); // eslint-disable-line

  /* URL更新（pageも管理） */
  const pushSearch = useCallback(
    (q: string, sort: "new" | "popular", tags: string[], pageNo: number) => {
      const usp = new URLSearchParams();
      if (q) usp.set("q", q);
      if (sort !== "new") usp.set("sort", sort);
      const tagParam = toTagsParam(tags);
      if (tagParam) usp.set("tags", tagParam);
      if (pageNo > 1) usp.set("page", String(pageNo));

      const next = `${pathname}${usp.toString() ? `?${usp.toString()}` : ""}`;
      const current = `${pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      if (next !== current) router.push(next);
    },
    [pathname, params, router]
  );

  /* データ取得（ページネーション対応） */
  const fetchData = useCallback(async () => {
    if (!canSearch) {
      setItems([]);
      setTotalPages(1);
      setErr(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);

    const offset = (page - 1) * LIMIT;
    const hasTags = selectedTags.length > 0;
    const listRpc = hasTags ? "list_posts_with_tags" : "list_posts";
    const countRpc = hasTags ? "count_posts_with_tags" : "count_posts";

    const payload: any = {
      p_q: qParamRaw || null,
      p_sort: sortParam,
      p_limit: LIMIT,
      p_offset: offset,
    };
    if (hasTags) payload.p_tags = selectedTags;

    try {
      const [listRes, countRes] = await Promise.all([
        supabase.rpc(listRpc, payload),
        hasTags
          ? supabase.rpc(countRpc, {
              p_q: qParamRaw || null,
              p_tags: selectedTags,
            })
          : supabase.rpc(countRpc, { p_q: qParamRaw || null }),
      ]);

      if (listRes.error) throw listRes.error;
      if (countRes.error) throw countRes.error;

      const rows = (listRes.data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        cover_image_url: r.cover_image_url ?? null,
        like_count: r.like_count ?? 0,
        author_username: r.author_username ?? null,
        author_display_name: r.author_display_name ?? null,
        author_avatar_url: r.author_avatar_url ?? null,
      })) as FeedPost[];

      const total = Number(countRes.data ?? 0);
      const pages = Math.max(1, Math.ceil(total / LIMIT));
      // ページがはみ出したら1ページ目へ（URL更新で再取得される）
      if (page > pages) {
        setLoading(false);
        pushSearch(qParamRaw, sortParam, selectedTags, 1);
        return;
      }

      setItems(rows);
      setTotalPages(pages);
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    canSearch,
    page,
    selectedTags,
    qParamRaw,
    sortParam,
    supabase,
    pushSearch,
  ]);

  // 条件 or page 変化で取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ハンドラ */
  const handleSearch = () => {
    if (!(query.trim().length >= 2 || selectedTags.length > 0)) return;
    // 新検索は1ページ目へ
    pushSearch(query.trim(), sortParam, selectedTags, 1);
  };
  const clearSearch = () => {
    if (!query) return;
    setQuery("");
    pushSearch("", sortParam, selectedTags, 1);
  };
  const handleSort = (_: any, v: "new" | "popular" | null) => {
    if (!v || v === sortParam) return;
    pushSearch(qParamRaw, v, selectedTags, 1);
  };
  const handleTagsChange = (_: any, values: string[]) => {
    if (arraysEqual(values, selectedTags)) return;
    setSelectedTags(values);
    pushSearch(qParamRaw, sortParam, values, 1);
  };
  const handlePageChange = (_: any, nextPage: number) => {
    if (nextPage === page) return;
    pushSearch(qParamRaw, sortParam, selectedTags, nextPage);
  };

  /* 候補（そのまま） */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: me } = await supabase.auth.getUser();
        const uid = me.user?.id;
        if (!uid) {
          if (!cancelled) {
            setMyTags([]);
            setPopularTags([]);
          }
          return;
        }
        const { data: tagsData } = await supabase
          .from("tags")
          .select("name")
          .eq("owner_id", uid);
        if (!cancelled)
          setMyTags((tagsData ?? []).map((t: any) => t.name as string));
        const { data: ptData } = await supabase
          .from("post_tags")
          .select(`tags!inner(name), posts!inner(id, author_id, is_published)`)
          .eq("posts.author_id", uid)
          .eq("posts.is_published", true);
        const counts = new Map<string, number>();
        (ptData ?? []).forEach((row: any) => {
          const name = row.tags?.name as string | undefined;
          if (!name) return;
          counts.set(name, (counts.get(name) ?? 0) + 1);
        });
        const list = Array.from(counts.entries())
          .map(([name, cnt]) => ({ name, cnt }))
          .sort((a, b) => b.cnt - a.cnt)
          .slice(0, 12);
        if (!cancelled) setPopularTags(list);
      } catch {
        if (!cancelled) {
          setMyTags([]);
          setPopularTags([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const tagOptions: string[] = useMemo(() => {
    const base = new Set<string>([...PRESET_CATEGORIES]);
    (myTags ?? []).forEach((t) => base.add(t));
    return Array.from(base).sort((a, b) => a.localeCompare(b, "ja"));
  }, [myTags]);

  return (
    <Box sx={{ mx: "auto", px: 2, py: 3 }}>
      {/* 検索バー + ソート */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
      >
        <TextField
          placeholder="キーワード（2文字以上） or タグで検索…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {query && (
                  <IconButton
                    aria-label="clear"
                    size="small"
                    onClick={clearSearch}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <Button
                  onClick={handleSearch}
                  sx={{ ml: 1 }}
                  variant="contained"
                  disabled={
                    !(query.trim().length >= 2 || selectedTags.length > 0)
                  }
                >
                  検索
                </Button>
              </InputAdornment>
            ),
          }}
        />
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

      {/* タグ選択 */}
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          タグで絞り込む
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={tagOptions}
          value={selectedTags}
          onChange={handleTagsChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={`${option}-${index}`}
                label={option}
              />
            ))
          }
          renderInput={(p) => (
            <TextField {...p} placeholder="タグを入力 or 選択（複数可）" />
          )}
          fullWidth
        />
        {popularTags && popularTags.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {popularTags.map((t) => {
              const next = Array.from(new Set([...selectedTags, t.name]));
              const disabled = arraysEqual(next, selectedTags);
              return (
                <Chip
                  key={t.name}
                  label={`${t.name} (${t.cnt})`}
                  variant="outlined"
                  onClick={() =>
                    !disabled && handleTagsChange(null as any, next)
                  }
                  disabled={disabled}
                  sx={{ mb: 1 }}
                />
              );
            })}
          </Stack>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* 結果 */}
      {!canSearch ? (
        <Typography color="text.secondary">
          検索キーワード（2文字以上）またはタグを指定してください。
        </Typography>
      ) : loading && items.length === 0 ? (
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
        <>
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
                id={p.id}
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

          {/* ページネーション */}
          <Box sx={{ display: "grid", placeItems: "center", py: 3 }}>
            <Pagination
              page={page}
              count={totalPages}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              siblingCount={0}
              boundaryCount={1}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
