// /app/posts/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import ClientPostPage from "./ClientPostPage";
import { createClient } from "@supabase/supabase-js";

type Params = { slug: string };
type Search = Record<string, string | string[] | undefined> | undefined;

// server-side supabase（anonでRLS内アクセス）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripMd = (md: string) =>
  (md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[>#*_~]/g, "")
    .replace(/\n+/g, " ")
    .trim();

// ★ ここがポイント：params / searchParams は Promise を受け取り await する
export async function generateMetadata(
  {
    params,
    searchParams,
  }: {
    params: Promise<Params>;
    searchParams: Promise<Search>;
  },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;

  const tokenMaybe = sp?.token;
  const token = Array.isArray(tokenMaybe)
    ? tokenMaybe[0]
    : tokenMaybe ?? undefined;

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
    return { title: "記事が見つかりませんでした" };
  }

  const title = post.title ?? "記事";
  const desc =
    stripMd(post.body_md ?? "").slice(0, 120) || "この記事のプレビューです。";

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const canonical = `${base}/posts/${encodeURIComponent(post.slug)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  const ogImage =
    post.cover_image_url || `${base}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
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
  // 表示はクライアントに委譲
  return <ClientPostPage />;
}
