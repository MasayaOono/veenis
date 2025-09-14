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

type Props = { searchParams: { sort?: string } };

export default async function HomePage({ searchParams }: Props) {
  const sort = (searchParams.sort === "popular" ? "popular" : "new") as
    | "new"
    | "popular";

  const sb = getServerSupabase();

  // RPC: 可視記事のみ + いいね数 + 著者情報JOIN済（p_limit/p_offsetでページング可）
  const { data: posts, error } = await sb.rpc("list_posts", {
    p_sort: sort,
    p_limit: 24,
    p_offset: 0,
  });

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
          {(posts ?? []).map((p: any) => {
            const img =
              p.cover_image_url || getPlaceholderCoverDataUrl(p.title, p.slug);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardActionArea
                    component={NextLink}
                    href={`/posts/${p.slug}`} // 日本語slugもOK（Nextが自動エンコード）
                    sx={{ display: "block" }}
                  >
                    <CardMedia
                      component="img"
                      image={img}
                      alt={p.title}
                      loading="lazy"
                      sx={{
                        aspectRatio: "3 / 2", // 生成SVGと統一（トリミング防止）
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
