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
  try {
    return new URL(url).toString();
  } catch {
    const leading = url.startsWith("/") ? "" : "/";
    return `${site}${leading}${url}`;
  }
}

function summarize(md: string, max = 120) {
  const s =
    (md || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/[#>*_~>-]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "";
  return s.slice(0, max);
}

// ★ RPCの戻りを単一行へ正規化（戻りが配列/オブジェクト/null どれでもOKに）
function one<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
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
  const proto =
    h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const site = `${proto}://${host}`;

  const sp = searchParams ? await searchParams : undefined;
  const tokenRaw = sp?.token;
  const token =
    typeof tokenRaw === "string" ? tokenRaw :
    Array.isArray(tokenRaw) ? tokenRaw[0] : undefined;

  const supabase = createServerComponentClient({ cookies });

  // === SECURITY DEFINER RPC を利用（戻り配列に注意） ===
  let post: any = null;

  if (token) {
    const { data } = await supabase.rpc("get_post_meta_by_token", {
      p_post_id: id,
      p_token: token,
    });
    post = one(data);
  } else {
    const { data } = await supabase.rpc("get_public_post_meta", {
      p_post_id: id,
    });
    post = one(data);
  }

  // 取得不可（非公開・期限切れ 等）
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

  const title = (post.title as string) || "記事";
  const desc = summarize(post.body_md ?? "");
  const canonical = `${site}/posts/${encodeURIComponent(id)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  const authorName =
    post.author_display_name || post.author_username || "";

  const coverAbs = abs(site, post.cover_image_url);
  const ogFallback =
    `${site}/posts/${encodeURIComponent(id)}/opengraph-image` +
    `?title=${encodeURIComponent(title)}` +
    (authorName ? `&author=${encodeURIComponent(authorName)}` : "") +
    (token ? `&token=${encodeURIComponent(token)}` : "");

  const ogImage = coverAbs || ogFallback;

  return {
    title,
    description: desc || "記事のプレビュー",
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description: desc || "記事のプレビュー",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc || "記事のプレビュー",
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
