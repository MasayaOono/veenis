// app/posts/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import { headers } from "next/headers";
import ClientPostPage from "./ClientPostPage";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GenMetaProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const stripMd = (md: string) =>
  (md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#>*_~>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata(
  props: GenMetaProps,
  _res: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (props.searchParams ? await props.searchParams : {}) || {};
  const tokenRaw = sp["token"];
  const token =
    typeof tokenRaw === "string"
      ? tokenRaw
      : Array.isArray(tokenRaw)
      ? tokenRaw[0]
      : undefined;

  // ★ リクエストヘッダからホスト/プロトコルを決定（貼り付け先ドメインと一致させる）
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  const site = `${proto}://${host}`;

  // 記事取得
  let post: any = null;
  if (token) {
    const { data, error } = await supabase.rpc("get_post_by_token", {
      p_slug: slug,
      p_token: token,
    });
    if (!error) post = data;
  } else {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, body_md, cover_image_url, visibility")
      .eq("slug", slug)
      .maybeSingle();
    if (!error) post = data;
  }

  if (!post) return { title: "記事が見つかりませんでした" };

  const title = post.title ?? "記事";
  const desc = stripMd(post.body_md ?? "").slice(0, 120) || "記事のプレビュー";

  const canonical = `${site}/posts/${encodeURIComponent(post.slug)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  // ★ カバー画像があればそれ、無ければ “このページ専用のOG画像ルート” を使う
  const fallbackOg = `${site}/posts/${encodeURIComponent(
    post.slug
  )}/opengraph-image${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const images = [post.cover_image_url || fallbackOg];

  const meta: Metadata = {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description: desc,
      images: images.map((url) => ({ url, width: 1200, height: 630 })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images,
    },
  };

  if (post.visibility !== "public") {
    meta.robots = { index: false, follow: false };
  }

  return meta;
}

export default function Page() {
  return <ClientPostPage />;
}
