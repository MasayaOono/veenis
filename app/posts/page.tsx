// app/posts/page.tsx などルートに合わせて
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
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

type TagAgg = { name: string; cnt: number };

const LIMIT = 40;
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

/* ---------- helpers ---------- */
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
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL → 派生値
  const qParam = (params.get("q") || "").trim();
  const sortParam = (params.get("sort") === "popular" ? "popular" : "new") as
    | "new"
    | "popular";
  const tagsParam = parseTagsParam(params.get("tags"));

  // UI state（入力）
  const [query, setQuery] = useState(qParam);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagsParam);

  // 表示データ
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 候補（オートコンプリート用）
  const [myTags, setMyTags] = useState<string[] | null>(null);
  const [popularTags, setPopularTags] = useState<TagAgg[] | null>(null);

  /* ---------- 1) URL→state 同期（差分がある時だけ） ---------- */
  useEffect(() => {
    if (query !== qParam) setQuery(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);
  useEffect(() => {
    if (!arraysEqual(selectedTags, tagsParam)) setSelectedTags(tagsParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("tags")]); // ← 直接 tagsParam を依存にすると毎回新配列なので get("tags") を見る

  /* ---------- 2) 安定した pushSearch（同一なら push しない） ---------- */
  const pushSearch = useCallback(
    (q: string, sort: "new" | "popular", tags: string[]) => {
      const usp = new URLSearchParams();
      if (q) usp.set("q", q);
      if (sort !== "new") usp.set("sort", sort); // 既定値は省略
      const tagParam = toTagsParam(tags);
      if (tagParam) usp.set("tags", tagParam);

      const next = `${pathname}?${usp.toString()}`;
      const current = `${pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      if (next === current) return; // 完全一致ならナビゲーションしない
      router.push(next);
    },
    [pathname, params, router]
  );

  /* ---------- データ読み込み（フィード） ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const hasTags = selectedTags.length > 0;
      const rpcName = hasTags ? "list_posts_with_tags" : "list_posts";
      const payload: any = {
        p_q: qParam || null,
        p_sort: sortParam,
        p_limit: LIMIT,
        p_offset: 0,
      };
      if (hasTags) payload.p_tags = selectedTags;

      const { data, error } = await supabase.rpc(rpcName, payload);
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
  }, [qParam, sortParam, selectedTags]);

  /* ---------- タグ候補（あなたのタグ一覧 / 人気タグ） ---------- */
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
        // あなたの所有タグ
        const { data: tagsData, error: tErr } = await supabase
          .from("tags")
          .select("name")
          .eq("owner_id", uid);
        if (tErr) throw tErr;
        if (!cancelled)
          setMyTags((tagsData ?? []).map((t: any) => t.name as string));

        // あなたの公開記事で多いタグ
        const { data: ptData, error: pErr } = await supabase
          .from("post_tags")
          .select(
            `
            tag_id,
            tags!inner(name, owner_id),
            posts!inner(id, author_id, is_published)
          `
          )
          .eq("posts.author_id", uid)
          .eq("posts.is_published", true);
        if (pErr) throw pErr;

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
  }, []);

  /* ---------- ハンドラ類（すべてガード付き） ---------- */
  const handleSearch = () => pushSearch(query.trim(), sortParam, selectedTags);
  const clearSearch = () => {
    if (!query) return;
    setQuery("");
    pushSearch("", sortParam, selectedTags);
  };
  const handleSort = (_: any, v: "new" | "popular" | null) => {
    if (!v || v === sortParam) return;
    pushSearch(qParam, v, selectedTags);
  };
  const handleTagsChange = (_: any, values: string[]) => {
    // 同一内容ならURL更新しない
    if (arraysEqual(values, selectedTags)) return;
    setSelectedTags(values);
    pushSearch(qParam, sortParam, values);
  };

  /* ---------- オートコンプリート候補 ---------- */
  const tagOptions: string[] = useMemo(() => {
    const base = new Set<string>([...PRESET_CATEGORIES]);
    (myTags ?? []).forEach((t) => base.add(t));
    return Array.from(base).sort((a, b) => a.localeCompare(b, "ja"));
  }, [myTags]);

  return (
    <Box sx={{ width: 1500, mx: "auto", px: 2, py: 3 }}>
      {/* 検索バー + ソート */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
      >
        <TextField
          placeholder="キーワードやタグ名で検索…"
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

      {/* タグ選択（複数 / freeSolo / オートコンプリート） */}
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
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip
                {...getTagProps({ index })}
                key={`${option}-${index}`}
                label={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} placeholder="タグを入力 or 選択（複数可）" />
          )}
          fullWidth
        />

        {/* 人気タグのショートカット */}
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
                  onClick={() => !disabled && handleTagsChange(null, next)}
                  disabled={disabled}
                  sx={{ mb: 1 }}
                />
              );
            })}
          </Stack>
        )}
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
