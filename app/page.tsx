// app/page.tsx
import { getServerSupabase } from "@/lib/supabaseServer";
import { getPlaceholderCoverDataUrl } from "@/utils/placeholderCover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import NextLink from "next/link";

// Supabase Auth HelpersはEdge非対応のためNode.jsランタイムを強制
export const runtime = "nodejs";
// 認証/DBアクセスあり：キャッシュさせない
export const dynamic = "force-dynamic";

// Next.js 15: searchParams は Promise
type SearchParams = Promise<{ sort?: string }>;

type PostCardData = {
  id: string;
  slug: string;
  title: string;
  cover_image_url?: string | null;
  like_count?: number | null;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sort: "new" | "popular" = sp?.sort === "popular" ? "popular" : "new";

  const sb = await getServerSupabase();

  // RPC: 可視記事のみ + いいね数 + 著者情報JOIN済（p_limit/p_offsetでページング可）
  const { data, error } = await sb.rpc("list_posts", {
    p_sort: sort,
    p_limit: 24,
    p_offset: 0,
  });

  const posts: PostCardData[] = Array.isArray(data)
    ? (data as PostCardData[])
    : [];

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1200, mx: "auto" }}>
      <Tabs value={sort} sx={{ mb: 2 }}>
        <Tab label="新着" value="new" component={NextLink} href="/" />
        <Tab
          label="人気"
          value="popular"
          component={NextLink}
          href="/?sort=popular"
        />
      </Tabs>

      {error ? (
        <Typography color="error">読み込みエラー: {error.message}</Typography>
      ) : (
        <Grid container spacing={2}>
          {posts.map((p) => {
            const img =
              p.cover_image_url ?? getPlaceholderCoverDataUrl(p.title, p.slug);
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardActionArea
                    component={NextLink}
                    href={`/posts/${encodeURIComponent(p.slug)}`}
                    sx={{ display: "block" }}
                  >
                    <CardMedia
                      component="img"
                      image={img}
                      alt={p.title}
                      loading="lazy"
                      sx={{
                        aspectRatio: "3 / 2",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        ❤️ {p.like_count ?? 0}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
