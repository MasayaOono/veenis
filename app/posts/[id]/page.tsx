// app/posts/[id]/page.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientPostPage from "./ClientPostPage";
import { createClient } from "@supabase/supabase-js";

// 動的（RLS/トークンで分岐）
export const dynamic = "force-dynamic";
export const revalidate = 0;
// ★ Service Role を使うため Node.js 実行に固定
export const runtime = "nodejs";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** 相対→絶対URL */
function abs(site: string, url?: string | null) {
  if (!url) return null;
  try {
    return new URL(url).toString();
  } catch {
    const leading = url.startsWith("/") ? "" : "/";
    return `${site}${leading}${url}`;
  }
}

/** メタ用に本文からテキストを抽出 */
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

/** 配列/単体/null を単一行に正規化 */
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

  // 共有先のクローラーでも正しい絶対URLを計算
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const site = `${proto}://${host}`;

  // token（リンク限定共有）
  const sp = searchParams ? await searchParams : undefined;
  const tokenRaw = sp?.token;
  const token =
    typeof tokenRaw === "string" ? tokenRaw :
    Array.isArray(tokenRaw) ? tokenRaw[0] : undefined;

  // === ここがポイント：Service Role クライアントを使う ===
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 投稿メタの取得（SECURITY DEFINER RPC or 直select）
  // - 公開: get_public_post_meta(p_post_id)
  // - トークン: get_post_meta_by_token(p_post_id, p_token)
  // ※ どちらも 1 行返す / もしくは配列1件想定
  let post: any = null;

  if (token) {
    const { data, error } = await admin.rpc("get_post_meta_by_token", {
      p_post_id: id,
      p_token: token,
    });
    if (!error) post = one(data);
  } else {
    const { data, error } = await admin.rpc("get_public_post_meta", {
      p_post_id: id,
    });
    if (!error) post = one(data);
  }

  // 取得できない場合（非公開・トークン不正など）
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

  // 期待するカラム名（RPC 側で以下を返すようにしておくと楽）
  // id, title, body_md, cover_image_url, visibility,
  // author_display_name, author_username
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
