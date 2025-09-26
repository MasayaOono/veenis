// app/posts/[id]/page.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientPostPage from "./ClientPostPage";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs"; // Service Role を使う可能性があるため node 固定

// Next.js 15: params / searchParams は Promise
type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/* ===== helpers ===== */
function abs(site: string, url?: string | null) {
  if (!url) return null;
  try { return new URL(url).toString(); } catch {
    return `${site}${url.startsWith("/") ? "" : "/"}${url}`;
  }
}
function summarize(md: string, max = 120) {
  const s = (md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#>*_~>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, max);
}
function one<T>(d: T | T[] | null | undefined): T | null {
  if (!d) return null;
  return Array.isArray(d) ? (d[0] ?? null) : d;
}
function getToken(sp?: Record<string, string | string[] | undefined>) {
  const raw = sp?.token;
  return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
}

/* ===== data fetchers（順にフォールバック） ===== */
async function fetchPostWithServiceRole(id: string, token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null; // SR 未設定なら skip

  const admin = createClient(url, service, { auth: { persistSession: false } });

  if (token) {
    const r1 = await admin.rpc("get_post_meta_by_token", { p_post_id: id, p_token: token });
    if (!r1.error && r1.data) return one(r1.data);
    const r2 = await admin.rpc("get_post_by_token_by_id", { p_post_id: id, p_token: token });
    if (!r2.error && r2.data) return one(r2.data);
  } else {
    const r = await admin.rpc("get_public_post_meta", { p_post_id: id });
    if (!r.error && r.data) return one(r.data);
    const s = await admin
      .from("posts")
      .select(`
        id, title, body_md, cover_image_url, visibility, author_id,
        author:profiles!posts_author_id_fkey(display_name, username)
      `)
      .eq("id", id)
      .eq("visibility", "public")
      .maybeSingle();
    if (!s.error && s.data) {
      const p = s.data as any;
      return {
        id: p.id,
        title: p.title,
        body_md: p.body_md,
        cover_image_url: p.cover_image_url,
        visibility: p.visibility,
        author_display_name: p.author?.display_name ?? null,
        author_username: p.author?.username ?? null,
      };
    }
  }
  return null;
}

async function fetchPostWithAnon(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const s = await sb
    .from("posts")
    .select(`
      id, title, body_md, cover_image_url, visibility, author_id,
      author:profiles!posts_author_id_fkey(display_name, username)
    `)
    .eq("id", id)
    .eq("visibility", "public")
    .maybeSingle();
  if (!s.error && s.data) {
    const p = s.data as any;
    return {
      id: p.id,
      title: p.title,
      body_md: p.body_md,
      cover_image_url: p.cover_image_url,
      visibility: p.visibility,
      author_display_name: p.author?.display_name ?? null,
      author_username: p.author?.username ?? null,
    };
  }
  return null;
}

/* ===== generateMetadata ===== */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const { id } = await params;

  // 絶対URLの組み立て（Slack/Twitter のクローラーでもOK）
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const site = `${proto}://${host}`;

  const token = getToken(searchParams ? await searchParams : undefined);

  // 1) Service Role 最優先（RLS回避）
  let post = await fetchPostWithServiceRole(id, token);

  // 2) まだ無ければ公開のみ匿名キー（保険）
  if (!post && !token) {
    post = await fetchPostWithAnon(id);
  }

  // 取得不可（非公開/無効トークン等）
  if (!post) {
    const canonical = `${site}/posts/${encodeURIComponent(id)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    return {
      title: "非公開記事",
      description: "記事のプレビュー",
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  // タイトル・著者は“必ず”非空になるように（空文字でOGに渡さない）
  const title = (post.title ?? "").toString().trim() || "タイトル未設定";
  const desc  = summarize(post.body_md ?? "") || "記事のプレビュー";
  const canonical = `${site}/posts/${encodeURIComponent(post.id ?? id)}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const authorName = post.author_display_name || post.author_username || "";

  const ogImage =
  `${site}/api/og` +
  `?title=${encodeURIComponent(title)}` +
  (authorName ? `&author=${encodeURIComponent(authorName)}` : "");

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
    ...(post.visibility !== "public" ? { robots: { index: false, follow: false } } : {}),
  };
}

export default function Page() {
  return <ClientPostPage />;
}
