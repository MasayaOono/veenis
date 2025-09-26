// app/posts/[id]/page.tsx
import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import ClientPostPage from "./ClientPostPage";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function abs(site: string, url?: string | null) {
  if (!url) return null;
  try { return new URL(url).toString(); } catch { return `${site}${url.startsWith("/") ? "" : "/"}${url}`; }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const { id } = await params;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const site = `${proto}://${host}`;

  const sp = searchParams ? await searchParams : undefined;
  const tokenRaw = sp?.token;
  const token =
    typeof tokenRaw === "string" ? tokenRaw :
    Array.isArray(tokenRaw) ? tokenRaw[0] : undefined;

  const supabase = createServerComponentClient({ cookies });

  // 記事 + 著者（FK名は環境に合わせて変更可）
  let post: any = null;
  if (token) {
    const { data } = await supabase.rpc("get_post_by_token_by_id", {
      p_post_id: id,
      p_token: token,
    });
    post = data;
  } else {
    const { data } = await supabase
      .from("posts")
      .select(`
        id, title, slug, body_md, cover_image_url, visibility,
        author:profiles!posts_author_id_fkey(display_name, username)
      `)
      .eq("id", id)
      .maybeSingle();
    post = data;
  }

  if (!post) {
    const canonical = `${site}/posts/${encodeURIComponent(id)}${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
    return {
      title: "非公開記事",
      description: "記事のプレビュー",
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  const strip = (md: string) =>
    (md || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/[#>*_~>-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const title = post.title ?? "記事";
  const desc = strip(post.body_md ?? "").slice(0, 120) || "記事のプレビュー";
  const canonical = `${site}/posts/${encodeURIComponent(post.id)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  const authorName =
    post.author?.display_name || post.author?.username || "";

  const coverAbs = abs(site, post.cover_image_url);
  const ogFallback = `${site}/posts/${encodeURIComponent(
    post.id
  )}/opengraph-image?title=${encodeURIComponent(title)}${
    authorName ? `&author=${encodeURIComponent(authorName)}` : ""
  }${token ? `&token=${encodeURIComponent(token)}` : ""}`;

  const ogImage = coverAbs || ogFallback;

  return {
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
    ...(post.visibility !== "public"
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default function Page() {
  return <ClientPostPage />;
}
