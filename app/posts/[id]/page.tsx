// app/posts/[id]/page.tsx
import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import ClientPostPage from "./ClientPostPage";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Next.js 15: params / searchParams は Promise
type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const { id } = await params;

  const sp = searchParams ? await searchParams : undefined;
  const tokenRaw = sp?.token;
  const token =
    typeof tokenRaw === "string"
      ? tokenRaw
      : Array.isArray(tokenRaw)
      ? tokenRaw[0]
      : undefined;

  // Host をヘッダから
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  const site = `${proto}://${host}`;

  // ★ CookieStore を渡す（Next15対応）
  const supabase = createServerComponentClient({ cookies });

  // 記事取得（トークン経由 or 通常公開）
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
      .select("id,title,slug,body_md,cover_image_url,visibility")
      .eq("id", id)
      .maybeSingle();
    post = data;
  }

  // 404/非公開など
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

  // 本文から簡易ディスクリプション抽出
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

  // ✅ カバー未設定時は共通のプレースホルダーAPIにフォールバック（OG/Twitter対応）
  const placeholderOg = `${site}/api/placeholder-cover?title=${encodeURIComponent(
    title
  )}`;

  const images = [post.cover_image_url || placeholderOg];

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
    ...(post.visibility !== "public"
      ? { robots: { index: false, follow: false } }
      : {}),
  };

  return meta;
}

export default function Page() {
  return <ClientPostPage />;
}
