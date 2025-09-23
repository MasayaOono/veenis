"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Button,
  Skeleton,
  Alert,
} from "@mui/material";

type FeedPost = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  published_at: string | null;
  read_minutes: number | null;
  author_id: string;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  like_count: number;
};

const LIMIT = 10;

export default function GroupFeedPage() {
  const supabase = useMemo(() => createClient(), []);
  const search = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, parseInt(search.get("page") ?? "1", 10));

  const [rows, setRows] = useState<FeedPost[] | null>(null);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    const load = async () => {
      setRows(null);
      const offset = (page - 1) * LIMIT;
      const { data, error } = await supabase.rpc("list_posts", {
        p_q: null,
        p_sort: "new",
        p_limit: LIMIT + 1, // 1件余分に取得して次ページ判定
        p_offset: offset,
      });
      if (error) {
        console.error(error);
        setRows([]);
        setHasNext(false);
        return;
      }
      const list = (data ?? []) as FeedPost[];
      setHasNext(list.length > LIMIT);
      setRows(list.slice(0, LIMIT));
    };
    load();
  }, [page]);

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">所属グループ/公開の新着（一覧）</Typography>
        <Button component={NextLink} href="/me">
          ダイジェストに戻る
        </Button>
      </Stack>

      {rows === null ? (
        <Skeleton variant="rounded" height={240} />
      ) : rows.length === 0 ? (
        <Alert severity="info" variant="outlined">
          表示できる記事がありません
        </Alert>
      ) : (
        <Stack spacing={1}>
          {rows.map((p) => (
            <Card key={p.id} variant="outlined">
              <CardActionArea component={NextLink} href={`/posts/${p.slug}`}>
                <CardContent>
                  <Typography variant="subtitle1">{p.title}</Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mt: 0.5 }}
                  >
                    <Avatar
                      src={p.author_avatar_url ?? undefined}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {p.author_display_name ?? p.author_username ?? "匿名"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ・
                      {p.published_at
                        ? new Date(p.published_at).toLocaleDateString()
                        : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ・❤ {p.like_count}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
            <Button
              disabled={page <= 1}
              onClick={() => router.push(`/me/groups?page=${page - 1}`)}
            >
              前へ
            </Button>
            <Typography variant="body2" color="text.secondary">
              ページ {page}
            </Typography>
            <Button
              disabled={!hasNext}
              onClick={() => router.push(`/me/groups?page=${page + 1}`)}
            >
              次へ
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
