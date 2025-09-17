// app/posts/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Image(props: Props) {
  const { slug } = await props.params;
  const sp = (props.searchParams ? await props.searchParams : {}) || {};
  const tokenRaw = sp["token"];
  const token =
    typeof tokenRaw === "string"
      ? tokenRaw
      : Array.isArray(tokenRaw)
      ? tokenRaw[0]
      : undefined;

  // 記事取得（タイトル/カバーだけ使う）
  let post: any = null;
  if (token) {
    const { data } = await supabase.rpc("get_post_by_token", {
      p_slug: slug,
      p_token: token,
    });
    post = data;
  } else {
    const { data } = await supabase
      .from("posts")
      .select("title, cover_image_url, visibility")
      .eq("slug", slug)
      .maybeSingle();
    post = data;
  }

  const title = (post?.title as string) || "記事";
  const cover = (post?.cover_image_url as string) || "";

  // 背景：カバーがあれば全画面に敷く（無ければシンプルなグラデ）
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Arial",
        }}
      >
        {/* bg */}
        {cover ? (
          <img
            src={cover}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.65)",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)",
            }}
          />
        )}

        {/* title */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "72px",
            display: "flex",
            alignItems: "flex-end",
            color: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              textShadow:
                "0 2px 6px rgba(0,0,0,.35), 0 10px 40px rgba(0,0,0,.35)",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    size
  );
}
