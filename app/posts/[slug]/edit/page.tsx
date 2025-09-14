// app/posts/[slug]/edit/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Link as MLink,
  IconButton,
  Paper,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import NextLink from "next/link";
import ContentColumn from "@/app/_components/ContentColumn";
import { supabase } from "@/lib/supabaseClient";
import type { RichEditorHandle } from "@/app/_components/RichEditor";
import { buildSlugVariants } from "@/utils/slugVariants";

const RichEditor = dynamic(() => import("@/app/_components/RichEditor"), {
  ssr: false,
});

/* ---------------- helpers ---------------- */
type Group = { id: string; name: string };
type PostRow = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  body_md: string;
  cover_image_url: string | null;
  visibility: "draft" | "public" | "group" | "link";
  link_token: string | null;
  group_id: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

function estimateReadMinutes(md: string) {
  const text = md.replace(/[`*_#>\-\[\]\(\)!\n\r]/g, "");
  const len = text.length;
  return Math.max(1, Math.ceil(len / 600));
}
function randomBase64Url(bytes = 20) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let bin = "";
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// タイトル用：placeholder を太字＆大きく
const titlePlaceholderSx = {
  "& .MuiInputBase-input::placeholder": {
    opacity: 1,
    fontWeight: 800,
    fontSize: { xs: "1.3rem", sm: "1.6rem" },
  },
  "& .MuiInputBase-root": { py: { xs: 1.25, sm: 1.75 } },
  "& .MuiInputBase-input": {
    fontWeight: 800,
    fontSize: { xs: "1.3rem", sm: "1.6rem" },
    lineHeight: 1.25,
  },
};
const normalPlaceholderSx = {
  "& .MuiInputBase-input::placeholder": { opacity: 1, fontWeight: 700 },
};

export default function EditPostPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const editorRef = useRef<RichEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [meId, setMeId] = useState<string | null>(null);
  const [post, setPost] = useState<PostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  // form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(""); // MD
  const [visibility, setVisibility] = useState<
    "draft" | "public" | "group" | "link"
  >("draft");
  const [groupId, setGroupId] = useState<string>("");

  // タグ（タイトル直下）
  const [tagsInput, setTagsInput] = useState("");
  const tags = useMemo(
    () =>
      Array.from(
        new Set(
          tagsInput
            .split(/[,\s]+/)
            .map((t) => t.trim())
            .filter(Boolean)
        )
      ),
    [tagsInput]
  );

  // カバー画像（差し替え）
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverExisting, setCoverExisting] = useState<string | null>(null); // DBの既存URL
  const [removeCover, setRemoveCover] = useState(false);

  /* ------- 初期ロード：認証→記事→権限→グループ/タグ ------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // 認証
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id ?? null;
        if (!uid) {
          router.replace(
            `/auth/login?next=/posts/${encodeURIComponent(slug)}/edit`
          );
          return;
        }
        setMeId(uid);

        // 記事（slug の変種にも対応）
        const variants = buildSlugVariants(slug);
        const { data: p, error: perr } = await supabase
          .from("posts")
          .select("*")
          .in("slug", variants)
          .maybeSingle();
        if (perr) throw perr;
        if (!p) {
          setErr("記事が見つかりません。");
          setLoading(false);
          return;
        }

        // 権限（自分の投稿のみ編集可）※RLSでも保護されるがUIでも弾く
        if (p.author_id !== uid) {
          setErr("この記事を編集する権限がありません。");
          setLoading(false);
          return;
        }

        // 初期値に反映
        setPost(p as PostRow);
        setTitle(p.title);
        setBody(p.body_md ?? "");
        setVisibility(p.visibility);
        setGroupId(p.group_id ?? "");
        setCoverExisting(p.cover_image_url ?? null);

        // 既存タグ
        const { data: pt } = await supabase
          .from("post_tags")
          .select(
            `
            tag_id,
            tags!inner(name),
            post_id
          `
          )
          .eq("post_id", p.id);
        const initTags = (pt ?? [])
          .map((r: any) => r.tags?.name as string)
          .filter(Boolean);
        setTagsInput(initTags.join(" ")); // 入力欄にはスペース区切りで表示

        // 所属グループ（選択肢）
        const { data: gms } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", uid);
        const ids = (gms ?? []).map((x: any) => x.group_id);
        if (ids.length) {
          const { data: gs } = await supabase
            .from("groups")
            .select("id, name")
            .in("id", ids);
          setGroups((gs ?? []) as Group[]);
        } else {
          setGroups([]);
        }
      } catch (e: any) {
        setErr(e?.message ?? "読み込みに失敗しました。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  /* ------- 画像アップロード（本文/カバー共通） ------- */
  const uploadToSupabase = async (file: File) => {
    const { data: me } = await supabase.auth.getUser();
    const userId = me?.user?.id;
    if (!userId) throw new Error("auth required");

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("public-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage
      .from("public-images")
      .getPublicUrl(path);
    return pub.publicUrl;
  };

  /* ------- カバー画像操作 ------- */
  const handlePickCover = () => coverInputRef.current?.click();
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRemoveCover(false);
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
  };
  const clearNewCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };
  const removeExistingCover = () => {
    // 既存カバーを削除指定（保存時に null で上書き）
    setRemoveCover(true);
    clearNewCover();
  };

  /* ------- 保存 ------- */
  const [saving, setSaving] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (!post || !meId) return;

    if (visibility === "group" && !groupId) {
      setErr("グループ限定公開を選択した場合は、グループを選んでください。");
      return;
    }

    setSaving(true);

    try {
      // 本文（本文内画像の一時URL→アップロード置換）
      const finalMd =
        (await editorRef.current?.exportMarkdownWithUploads(
          uploadToSupabase
        )) ?? body;

      // カバー：新規選択があればアップロード、削除指定なら null、未変更なら既存を維持
      let coverUrl: string | null = coverExisting;
      if (coverFile) {
        coverUrl = await uploadToSupabase(coverFile);
      }
      if (removeCover) {
        coverUrl = null;
      }

      // 公開状態
      const willPublish = visibility !== "draft";
      const readMinutes = estimateReadMinutes(finalMd);
      let linkToken = post.link_token;
      if (visibility === "link" && !linkToken) {
        linkToken = randomBase64Url(20);
      }
      if (visibility !== "link") {
        linkToken = null; // リンク限定解除
      }

      // 公開日時の扱い：下書き→公開になった場合のみ初回設定、既に公開済はそのまま
      const nextPublishedAt =
        willPublish && !post.published_at
          ? new Date().toISOString()
          : post.published_at;

      const { data: upd, error: uerr } = await supabase
        .from("posts")
        .update({
          title,
          body_md: finalMd,
          cover_image_url: coverUrl,
          visibility,
          link_token: linkToken,
          group_id: visibility === "group" ? groupId || null : null,
          is_published: willPublish,
          read_minutes: readMinutes,
          published_at: nextPublishedAt,
        })
        .eq("id", post.id)
        .select("slug, link_token")
        .single();
      if (uerr) throw uerr;

      // タグ反映
      if (tags.length) {
        const { error: tagErr } = await supabase.rpc("upsert_post_tags", {
          p_post_id: post.id,
          p_tag_names: tags,
        });
        if (tagErr) {
          setInfo(`保存は成功しましたが、タグ更新に失敗: ${tagErr.message}`);
        }
      } else {
        // 空なら関連を全削除（upsert_post_tags 内で delete 済みではあるが、nullを渡し忘れた場合の保険）
        await supabase.rpc("upsert_post_tags", {
          p_post_id: post.id,
          p_tag_names: [],
        });
      }

      // 遷移
      if (visibility === "link" && upd?.link_token) {
        router.replace(`/posts/${upd.slug}?token=${upd.link_token}`);
      } else {
        router.replace(`/posts/${upd.slug}`);
      }
    } catch (e: any) {
      setErr(e?.message ?? "保存に失敗しました。");
      setSaving(false);
    }
  };

  /* ------- UI ------- */
  if (loading) return <Typography sx={{ px: 2 }}>読み込み中...</Typography>;
  if (err) {
    return (
      <ContentColumn maxWidth={760}>
        <Alert severity="error" sx={{ my: 2 }}>
          {err}
        </Alert>
        <MLink component={NextLink} href="/posts">
          一覧へ戻る
        </MLink>
      </ContentColumn>
    );
  }
  if (!post) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <ContentColumn maxWidth={760}>
        <Typography variant="h5" gutterBottom>
          記事を編集
        </Typography>

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            {/* タイトル（大きめ） */}
            <TextField
              fullWidth
              label="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例）くせ毛向けドライヤーの選び方とプロの推し3選"
              required
              sx={titlePlaceholderSx}
            />

            {/* タグ（タイトル直下） */}
            <TextField
              fullWidth
              label="タグ（カンマ or スペース区切り）"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="例）ドライヤー くせ毛 速乾 サロンワーク"
              sx={normalPlaceholderSx}
            />
            {tags.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {tags.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </Stack>
            )}

            {/* 公開設定 */}
            <FormControl fullWidth>
              <InputLabel id="vis-label">公開方法</InputLabel>
              <Select
                labelId="vis-label"
                label="公開方法"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
              >
                <MenuItem value="draft">下書き（非公開）</MenuItem>
                <MenuItem value="public">完全公開</MenuItem>
                <MenuItem value="group">グループ限定</MenuItem>
                <MenuItem value="link">リンク限定公開</MenuItem>
              </Select>
            </FormControl>

            {visibility === "group" && (
              <FormControl fullWidth>
                <InputLabel id="grp-label">対象グループ</InputLabel>
                <Select
                  labelId="grp-label"
                  label="対象グループ"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value as string)}
                >
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* カバー画像（既存/差し替え/削除） */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                カバー画像（任意）
              </Typography>

              {coverPreview ? (
                <Paper
                  variant="outlined"
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 4,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreview}
                    alt="cover preview"
                    style={{
                      width: "100%",
                      display: "block",
                      maxHeight: 420,
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    onClick={clearNewCover}
                    color="error"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(255,255,255,0.9)",
                      "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                    }}
                    aria-label="remove new cover"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Paper>
              ) : coverExisting && !removeCover ? (
                <Paper
                  variant="outlined"
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 4,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverExisting}
                    alt="cover existing"
                    style={{
                      width: "100%",
                      display: "block",
                      maxHeight: 420,
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    onClick={removeExistingCover}
                    color="error"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(255,255,255,0.9)",
                      "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                    }}
                    aria-label="remove existing cover"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Paper>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => coverInputRef.current?.click()}
                >
                  カバー画像を選択
                </Button>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleCoverChange}
              />
            </Box>

            {/* 本文エディタ（入力と閲覧の見た目一致） */}
            <Box sx={{ width: "100%" }}>
              <RichEditor
                ref={editorRef}
                valueMd={body}
                onChangeMd={setBody}
                placeholder="大見出し、引用、リスト、画像、リンクに対応。画像は保存時に自動アップロードされます。"
              />
            </Box>

            {err && <Alert severity="error">{err}</Alert>}
            {info && <Alert severity="info">{info}</Alert>}

            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <Button
                type="submit"
                variant="contained"
                disabled={saving || !title || !body}
              >
                保存
              </Button>
              <Typography variant="body2" color="text.secondary">
                目安読了時間: {estimateReadMinutes(body)} 分
              </Typography>
              <Box sx={{ flex: 1 }} />
              <MLink component={NextLink} href={`/posts/${post.slug}`}>
                記事へ戻る
              </MLink>
            </Stack>
          </Stack>
        </form>
      </ContentColumn>
    </Box>
  );
}
