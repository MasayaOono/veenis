// app/posts/[id]/page.tsx
import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import ClientPostPage from "./ClientPostPage";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// 動的（閲覧権限やトークンで分岐するため）
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Next.js 15: params / searchParams は Promise
type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** 相対URLを絶対URLへ（既に絶対ならそのまま） */
function abs(site: string, url?: string | null) {
  if (!url) return null;
  try {
    return new URL(url).toString();
  } catch {
    const leading = url.startsWith("/") ? "" : "/";
    return `${site}${leading}${url}`;
  }
}

/** PRやコードブロック等を除去してメタ用に整形 */
function summarize(md: string, max = 120) {
  const s =
    (md || "")
      .replace(/```[\s\S]*?```/g, "")    // コードブロック
      .replace(/`[^`]*`/g, "")           // インラインコード
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // 画像
      .replace(/\[[^\]]*\]\([^)]+\)/g, "")  // リンク
      .replace(/[#>*_~>-]/g, "")         // Markdown記号
      .replace(/\s+/g, " ")
      .trim() || "";
  return s.slice(0, max);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const { id } = await params;

  // Site(絶対URL) をヘッダから決定
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const site = `${proto}://${host}`;

  // token（リンク限定などの将来拡張用）
  const sp = searchParams ? await searchParams : undefined;
  const tokenRaw = sp?.token;
  const token =
    typeof tokenRaw === "string"
      ? tokenRaw
      : Array.isArray(tokenRaw)
      ? tokenRaw[0]
      : undefined;

  // Supabase（クッキー連携）
  const supabase = createServerComponentClient({ cookies });

  // 記事取得（token 有りなら RPC、無ければ直接）
  // token 版の RPC が author 情報を返さない場合もあるので後でフォールバック処理
  let post: any = null;
  if (token) {
    const { data, error } = await supabase.rpc("get_post_by_token_by_id", {
      p_post_id: id,
      p_token: token,
    });
    if (!error) post = data;
  } else {
    const { data } = await supabase
      .from("posts")
      .select(
        `
        id, title, slug, body_md, cover_image_url, visibility, author_id,
        author:profiles!posts_author_id_fkey(display_name, username)
      `
      )
      .eq("id", id)
      .maybeSingle();
    post = data;
  }

  // 見つからない / 権限なし
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

  // token ルートで author が無かった場合のフォールバック取得（軽量）
  let authorName = post.author?.display_name || post.author?.username || "";
  if (!authorName && post.author_id) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", post.author_id)
      .maybeSingle();
    if (prof) authorName = prof.display_name || prof.username || "";
  }

  const title = (post.title as string) || "記事";
  const desc = summarize(post.body_md ?? "");
  const canonical = `${site}/posts/${encodeURIComponent(post.id)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  // カバー > OG生成 の優先順で画像URLを作成（絶対URL保証）
  const coverAbs = abs(site, post.cover_image_url);
  const ogFallback =
    `${site}/posts/${encodeURIComponent(post.id)}/opengraph-image` +
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
