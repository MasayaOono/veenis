// /app/posts/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import ClientPostPage from "./ClientPostPage";
import { createClient } from "@supabase/supabase-js";

type Props = { params: { slug: string }; searchParams: { token?: string } };

const stripMd = (md: string) =>
  (md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#>*_~>-]/g, "")
    .replace(/\n+/g, " ")
    .trim();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params, searchParams }: Props,
  _res: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;
  const token = searchParams.token;

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

  if (!post) {
    return {
      title: "記事が見つかりませんでした",
    };
  }

  const title = post.title ?? "記事";
  const desc = stripMd(post.body_md ?? "").slice(0, 120) || "記事のプレビュー";
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://example.com";
  const url = `${base}/posts/${encodeURIComponent(post.slug)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  const ogImage =
    post.cover_image_url || `${base}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: desc,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
  };
}

export default function Page() {
  // 表示はクライアント側に委譲
  return <ClientPostPage />;
}
