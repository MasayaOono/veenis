// app/posts/[slug]/edit/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Link,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import NextLink from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { slugify } from "@/utils/slugify";
import type { RichEditorHandle } from "@/app/_components/RichEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { buildSlugVariants } from "@/utils/slugVariants";

const RichEditor = dynamic(() => import("@/app/_components/RichEditor"), {
  ssr: false,
});

/* -------------------- 小ユーティリティ -------------------- */
type Group = { id: string; name: string };
type PostRow = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  body_md: string | null;
  cover_image_url: string | null;
  visibility: "draft" | "public" | "group" | "link";
  group_id: string | null;
  link_token: string | null;
  is_published: boolean;
  published_at: string | null;
  read_minutes: number | null;
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

// タイトル placeholder（大）
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
// タグ placeholder（通常）
const normalPlaceholderSx = {
  "& .MuiInputBase-input::placeholder": { opacity: 1, fontWeight: 700 },
};

/* ===== 記入例タブ（/posts/new と同一） ===== */
const SAMPLES: { label: string; md: string }[] = [
  // （長いので省略せずそのまま new ページと完全一致で置いてください）
  // ここではサンプルを数件だけ載せています。実装では new と同じ配列をコピペしてください。
  {
    label: "共通：カウンセリング雛形",
    md: `# カウンセリングテンプレ（共通）

> 目的：初回〜3回目で「再現性」と「不満ゼロ」化。所要 5–8分。

...（中略：/posts/new の SAMPLES をそのまま貼り付け）...
`,
  },
];

/* -------------------- ここから本体 -------------------- */
export default function EditPostPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const tokenParam = params.get("token") || null; // リンク限定での閲覧編集を想定するなら使用

  const editorRef = useRef<RichEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  // 対象ポスト
  const [post, setPost] = useState<PostRow | null>(null);

  // form（初期値はロード後に流し込み）
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(""); // Markdown
  const [visibility, setVisibility] = useState<
    "draft" | "public" | "group" | "link"
  >("draft");
  const [groupId, setGroupId] = useState<string>("");

  // タグ
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

  // カバー画像
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverCleared, setCoverCleared] = useState(false); // 元画像を消す指定

  // UI 状態
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 記入例タブ & 右ペイン開閉
  const [sampleIdx, setSampleIdx] = useState(0);
  const [rightOpen, setRightOpen] = useState(true);
  const currentSample = SAMPLES[sampleIdx]?.md ?? "";

  // 挿入確認ダイアログ
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSampleMd, setPendingSampleMd] = useState<string | null>(null);

  /* ---------- 認証＆グループ候補 ---------- */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace(
          `/auth/login?next=/posts/${encodeURIComponent(String(slug))}/edit`
        );
        return;
      }
      setUid(u.id);

      const { data: gms } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", u.id);
      const ids = (gms ?? []).map((x: any) => x.group_id);
      if (ids.length) {
        const { data: gs } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", ids);
        setGroups((gs ?? []) as Group[]);
      }
    };
    init();
  }, [router, slug]);

  /* ---------- 対象記事の読み込み（作者本人限定 + スラッグ揺れ吸収） ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;

      setErr(null);
      // 自分
      const { data: me, error: meErr } = await supabase.auth.getUser();
      if (meErr) {
        setErr(meErr.message);
        return;
      }
      const myId = me.user?.id;
      if (!myId) {
        setErr("ログインが必要です。");
        return;
      }

      // スラッグ揺れ（decode → variants）
      const raw = (() => {
        try {
          return decodeURIComponent(String(slug));
        } catch {
          return String(slug);
        }
      })();
      const variants = buildSlugVariants(raw);

      // 通常：作者本人のみ見える前提
      const r = await supabase
        .from("posts")
        .select(
          "id, author_id, title, slug, body_md, cover_image_url, visibility, group_id, link_token, is_published, published_at, read_minutes"
        )
        .in("slug", variants)
        .eq("author_id", myId)
        .maybeSingle();

      if (cancelled) return;

      if (r.error || !r.data) {
        setErr("記事が見つかりません。編集権限がない可能性があります。");
        setPost(null);
        return;
      }

      const p = r.data as PostRow;
      setPost(p);
      setTitle(p.title ?? "");
      setBody(p.body_md ?? "");
      setVisibility(p.visibility ?? "draft");
      setGroupId(p.group_id ?? "");
      setCoverPreview(p.cover_image_url ?? null);
      setCoverCleared(false);

      // タグ（post_tags → tags(name)）
      const pt = await supabase
        .from("post_tags")
        .select("tags(name)")
        .eq("post_id", p.id);

      const tagNames =
        (pt.data ?? [])
          .map((row: any) => row.tags?.name as string | undefined)
          .filter(Boolean) ?? [];
      setTagsInput(tagNames.join(" "));
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* ---------- ストレージアップロード共通（new と同じ） ---------- */
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

  /* ---------- カバー画像ハンドラ ---------- */
  const handlePickCover = () => coverInputRef.current?.click();
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(url);
    setCoverCleared(false);
  };
  const clearCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setCoverCleared(true);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  /* ---------- 記入例挿入フロー（new と同じ） ---------- */
  const requestInsertSample = (md: string) => {
    if (body.trim().length === 0) {
      setBody(md);
      return;
    }
    setPendingSampleMd(md);
    setConfirmOpen(true);
  };
  const confirmOverwrite = () => {
    if (pendingSampleMd != null) setBody(pendingSampleMd);
    setPendingSampleMd(null);
    setConfirmOpen(false);
  };
  const cancelOverwrite = () => {
    setPendingSampleMd(null);
    setConfirmOpen(false);
  };

  /* ---------- 保存（update） ---------- */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (!uid || !post) return;

    if (visibility === "group" && !groupId) {
      setErr("グループ限定公開を選択した場合は、グループを選んでください。");
      return;
    }

    setSaving(true);

    try {
      // 本文内画像のバッチアップロード & URL置換
      const finalMd =
        (await editorRef.current?.exportMarkdownWithUploads(
          uploadToSupabase
        )) ?? body;
      const readMinutes = estimateReadMinutes(finalMd);

      // カバー画像アップロード or クリア判定
      let coverUrl: string | null | undefined = undefined; // undefined=変更なし / null=消す / string=新URL
      if (coverFile) {
        coverUrl = await uploadToSupabase(coverFile);
      } else if (coverCleared) {
        coverUrl = null;
      }

      // 公開状態遷移：draft->公開系に変わったら published_at を今に
      const nowIso = new Date().toISOString();
      const nextIsPublished = visibility !== "draft";

      // リンク限定のトークン付与（なければ作成）
      let linkToken = post.link_token ?? null;
      if (visibility === "link" && !linkToken) {
        linkToken = randomBase64Url(20);
      }

      // スラッグは基本維持（タイトル変更時の自動変更はしない）
      // もしスラッグも変えたい場合は別UIにするのが安全
      const payload: Record<string, any> = {
        title,
        body_md: finalMd,
        visibility,
        group_id: visibility === "group" ? groupId : null,
        is_published: nextIsPublished,
        read_minutes: readMinutes,
      };
      if (coverUrl !== undefined) payload.cover_image_url = coverUrl;
      if (visibility === "link") payload.link_token = linkToken;
      if (!post.is_published && nextIsPublished) {
        payload.published_at = nowIso;
      }
      if (post.is_published && !nextIsPublished) {
        payload.published_at = null;
      }

      const { data: updated, error: upErr } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", post.id)
        .select("id, slug, link_token, visibility")
        .single();

      if (upErr) throw upErr;

      // タグ反映（new と同様）
      if (tags.length) {
        const { error: tagErr } = await supabase.rpc("upsert_post_tags", {
          p_post_id: post.id,
          p_tag_names: tags,
        });
        if (tagErr)
          setInfo(
            `保存は成功しましたが、タグの反映に失敗しました: ${tagErr.message}`
          );
      } else {
        // タグ入力空なら、既存タグを全部剥がしたい場合は別RPCを用意して呼ぶ
        // ここでは「何もしない」（既存を保持）にしています。必要なら削除RPCを呼んでください。
      }

      // 成功→遷移
      const destSlug = updated!.slug;
      const destVis = updated!.visibility as PostRow["visibility"];
      if (destVis === "link") {
        const share = `${window.location.origin}/posts/${destSlug}?token=${
          updated!.link_token
        }`;
        await navigator.clipboard.writeText(share).catch(() => {});
        router.replace(`/posts/${destSlug}?token=${updated!.link_token}`);
      } else {
        router.replace(`/posts/${destSlug}`);
      }
    } catch (e: any) {
      setErr(e?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- レンダリング ---------- */
  if (!post) {
    // 初回ロード前に一瞬だけ null の可能性があるので、必要ならスケルトンに
    // ここでは軽い案内だけ出しておく
    // 実データ取得エラー時は err に詳細が入ります
  }

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        "& .MuiOutlinedInput-root": { borderRadius: 4 },
        "& .MuiOutlinedInput-root fieldset": { borderRadius: 4 },
        p: { xs: 2, md: 3 },
      }}
    >
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {/* タイトル */}
          <TextField
            fullWidth
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例）くせ毛向けドライヤーの選び方とプロの推し3選"
            required
            sx={titlePlaceholderSx}
          />

          {/* タグ */}
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
              onChange={(e) =>
                setVisibility(e.target.value as PostRow["visibility"])
              }
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

          {/* カバー画像 */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                  onClick={clearCover}
                  color="error"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(255,255,255,0.9)",
                    "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                  }}
                  aria-label="remove cover"
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ) : (
              <Button variant="outlined" onClick={handlePickCover}>
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

          {/* 右ペイン開閉トグル */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              startIcon={rightOpen ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setRightOpen((v) => !v)}
            >
              記入例を{rightOpen ? "閉じる" : "開く"}
            </Button>
          </Box>

          {/* 本文：左 / 記入例：右 */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: rightOpen
                ? { xs: "1fr", md: "minmax(0,1fr) minmax(0,1fr)" }
                : { xs: "1fr", md: "minmax(0,1fr)" },
              alignItems: "start",
            }}
          >
            {/* 左：エディタ */}
            <Box sx={{ width: "100%", minWidth: 0 }}>
              <RichEditor
                ref={editorRef}
                valueMd={body}
                onChangeMd={setBody}
                placeholder="大見出し、引用、リスト、画像、リンクに対応。画像は保存時に自動アップロードされます。"
              />
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mt: 1 }}
              >
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
              </Stack>
            </Box>

            {/* 右：記入例（sticky + 内部スクロール） */}
            {rightOpen && (
              <Box
                sx={{
                  position: { md: "sticky" },
                  top: { xs: 0, md: 88 },
                  alignSelf: "flex-start",
                  height: { md: "calc(100vh - 88px - 16px)" },
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 0,
                    minWidth: 0,
                    height: { md: "100%" },
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Tabs
                    value={sampleIdx}
                    onChange={(_, v) => setSampleIdx(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {SAMPLES.map((s, i) => (
                      <Tab key={i} label={s.label} />
                    ))}
                  </Tabs>

                  <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        記入例プレビュー
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => requestInsertSample(currentSample)}
                      >
                        この例を挿入（上書き）
                      </Button>
                    </Stack>

                    <Box
                      className="article-body"
                      sx={{
                        fontSize: "0.95rem",
                        "& img": { maxWidth: "100%", height: "auto" },
                      }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {currentSample}
                      </ReactMarkdown>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* 執筆アドバイス（new と同一） */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        執筆アドバイス
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Chip
                          size="small"
                          label={`現在の目安読了 ${estimateReadMinutes(
                            body
                          )}分`}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={(() => {
                            const m = estimateReadMinutes(body);
                            if (m <= 2) return "短時間でサクッと読みたい人向け";
                            if (m <= 5)
                              return "通勤・待ち時間の読者に届きやすい";
                            if (m <= 8) return "比較・検討層に刺さるボリューム";
                            return "長文：章立て・目次・冒頭要約を";
                          })()}
                        />
                      </Stack>

                      <Stack component="ul" sx={{ pl: 2, m: 0 }} spacing={1}>
                        <Typography component="li" variant="body2">
                          冒頭2〜3行で「<b>誰の・どんな悩みが・どう解決</b>
                          するか」を明示。
                        </Typography>
                        <Typography component="li" variant="body2">
                          セクションは <b>H2主体</b>・<b>3〜6行</b>
                          で小分け、空行で呼吸を作る。
                        </Typography>
                        <Typography component="li" variant="body2">
                          箇条書きは各行に<b>太字キーワード</b>を1つだけ。
                        </Typography>
                        <Typography component="li" variant="body2">
                          施術記事は<b>所要時間・持ち・頻度</b>
                          を明記。ホームケアは<b>今日から3手順</b>に。
                        </Typography>
                        <Typography component="li" variant="body2">
                          写真は横長1200px目安。<b>ビフォー→工程→アフター</b>
                          で説得力UP。
                        </Typography>
                        <Typography component="li" variant="body2">
                          3分超は<b>冒頭要約（3行）</b>と<b>目次</b>で離脱防止。
                        </Typography>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        目安ボリューム：
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        <Chip
                          size="small"
                          variant="outlined"
                          label="2〜4分：お役立ちTips/告知"
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label="5〜7分：比較・完全ガイド"
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label="8分〜：特集・深掘り（要目次）"
                        />
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>

          {err && <Alert severity="error">{err}</Alert>}
          {info && <Alert severity="info">{info}</Alert>}

          <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
            <Box sx={{ flex: 1 }} />
            <Link component={NextLink} href="/posts">
              一覧へ戻る
            </Link>
          </Stack>
        </Stack>
      </form>

      {/* 記入例上書き確認 */}
      <Dialog open={confirmOpen} onClose={cancelOverwrite}>
        <DialogTitle>記入例を上書き挿入しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            現在の本文は<strong>記入例で置き換え</strong>
            られます。元に戻す場合は
            <kbd>Ctrl/⌘ + Z</kbd> で取り消せます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOverwrite}>キャンセル</Button>
          <Button onClick={confirmOverwrite} color="error" variant="contained">
            上書きする
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
