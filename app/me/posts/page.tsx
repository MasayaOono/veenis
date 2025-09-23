"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Pagination,
  Skeleton,
  Alert,
  Button,
} from "@mui/material";

type MyPost = {
  id: string;
  title: string;
  slug: string;
  visibility: "public" | "link" | "group" | "draft";
  is_published: boolean;
  group_id: string | null;
  published_at: string | null;
  updated_at: string;
};

const LIST_LIMIT = 10;

export default function MyPostsPage() {
  const supabase = useMemo(() => createClient(), []);

  const search = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, parseInt(search.get("page") ?? "1", 10));

  const [rows, setRows] = useState<MyPost[] | null>(null);
  const [total, setTotal] = useState<number>(0);

  const fetchList = useCallback(async (p: number) => {
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) {
      setRows([]);
      setTotal(0);
      return;
    }
    const from = (p - 1) * LIST_LIMIT;
    const to = from + LIST_LIMIT - 1;

    const { data, count, error } = await supabase
      .from("posts")
      .select(
        "id, title, slug, visibility, is_published, group_id, published_at, updated_at",
        { count: "exact" }
      )
      .eq("author_id", uid)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      setRows([]);
      setTotal(0);
      return;
    }
    setRows((data ?? []) as MyPost[]);
    setTotal(count ?? 0);
  }, []);

  useEffect(() => {
    setRows(null);
    fetchList(page);
  }, [page, fetchList]);

  const handlePage = (_: any, p: number) => {
    router.push(`/me/posts?page=${p}`);
  };

  const chip = (v: MyPost["visibility"], pub: boolean) => {
    if (!pub) return <Chip size="small" label="下書き" />;
    if (v === "public") return <Chip size="small" label="公開" />;
    if (v === "group") return <Chip size="small" label="グループ限定" />;
    if (v === "link") return <Chip size="small" label="リンク限定" />;
    return null;
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">自分の投稿（一覧）</Typography>
        <Button component={NextLink} href="/me">
          ダイジェストに戻る
        </Button>
      </Stack>

      {rows === null ? (
        <Skeleton variant="rounded" height={240} />
      ) : rows.length === 0 ? (
        <Alert severity="info" variant="outlined">
          投稿はありません
        </Alert>
      ) : (
        <Stack spacing={1}>
          {rows.map((p) => (
            <Card key={p.id} variant="outlined">
              <CardActionArea component={NextLink} href={`/posts/${p.id}`}>
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Typography variant="subtitle1">{p.title}</Typography>
                    {chip(p.visibility, p.is_published)}
                    {p.group_id && (
                      <Chip size="small" label="所属グループ記事" />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {p.published_at
                      ? `公開: ${new Date(p.published_at).toLocaleString()}`
                      : `更新: ${new Date(p.updated_at).toLocaleString()}`}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
            <Pagination
              page={page}
              count={Math.max(1, Math.ceil(total / LIST_LIMIT))}
              onChange={handlePage}
              color="primary"
            />
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
