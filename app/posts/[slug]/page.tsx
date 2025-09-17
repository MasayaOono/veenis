import type { Metadata, ResolvingMetadata } from "next";
import ClientPostPage from "./ClientPostPage";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  },
  _res: ResolvingMetadata
): Promise<Metadata> {
  // ★ Promise を剥がす
  const { slug } = await props.params;
  const sp = (props.searchParams ? await props.searchParams : {}) || {};
  const tokenRaw = sp["token"];
  const token =
    typeof tokenRaw === "string"
      ? tokenRaw
      : Array.isArray(tokenRaw)
      ? tokenRaw[0]
      : undefined;

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

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://veenis.vercel.app";

  const title = post.title ?? "記事";
  const desc =
    (post.body_md ?? "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/[#>*_~>-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "記事のプレビュー";

  const canonical = `${site}/posts/${encodeURIComponent(post.slug)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;
  const ogImage =
    post.cover_image_url || `${site}/api/og?title=${encodeURIComponent(title)}`;

  const meta: Metadata = {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
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
