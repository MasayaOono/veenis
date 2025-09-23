// app/posts/[id]/edit/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Button,
  Stack,
  Typography,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  IconButton,
  Paper,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  InputBase,
  TextField,
  CircularProgress,
} from "@mui/material";
import NextLink from "next/link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TocIcon from "@mui/icons-material/Toc";
import { createClient } from "@/lib/supabase";
import { slugify } from "@/utils/slugify";
import type { RichEditorHandle } from "@/app/_components/RichEditor";
import LeaveConfirmDialog from "@/app/_components/LeaveConfirmDialog";
import { useLeaveConfirm } from "@/app/_hooks/useLeaveConfirm";

const RichEditor = dynamic(() => import("@/app/_components/RichEditor"), {
  ssr: false,
});

type Group = { id: string; name: string };
type TocItem = { level: 1 | 2 | 3; text: string };

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

/* ===== テンプレ ===== */
const SAMPLES: { label: string; md: string }[] = [
  {
    label: "共通：カウンセリング雛形",
    md: `# カウンセリングテンプレ（共通）

> 目的：初回〜3回目で「再現性」と「不満ゼロ」化。所要 5–8分。

## 1) ゴール定義（今日は何が変われば成功？）
- 悩み：＿＿＿＿＿＿（例：広がり／ツヤ不足／持ち）
- 仕上がりキーワード：＿＿＿＿＿＿（例：軽い・柔らかい・締まる）
- 優先順位：見た目 / ダメージ最小 / 時短 のどれ？

## 2) 履歴・素材評価
- 直近履歴：＿＿＿＿（カラー/パーマ/縮毛/黒染め）
- ホームケア：＿＿＿＿（頻度・アイテム）
- 素材：太さ＿/量＿/ダメージ＿/癖＿/浮き＿/生えグセ＿
`,
  },
  {
    label: "ヘア：ブリーチ設計",
    md: `# ブリーチ設計（黒染め履歴ありの想定）

## 目的・KPI
- 目標明度：10〜11Lv／オレンジ残り最小
- ダメージ指標：ウェット伸び＜5%、ドライ弾力維持
`,
  },
  {
    label: "中性矯正（くせ中〜強）",
    md: `# 中性矯正プロトコル（ショート〜ミディアム）

## 素材評価
- うねり：3/5　捻転：2/5　撥水：中
`,
  },
  {
    label: "ネイル：時短×持ち",
    md: `# ジェルワンカラー：時短&持ち最適化

## 所要・単価目安
- 60分 / ¥¥¥　目標リピ率：85%
`,
  },
];

export default function EditPostPage() {
  const supabase = useMemo(() => createClient(), []);

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = decodeURIComponent(params.id);

  const editorRef = useRef<RichEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // 既存投稿
  const [postId, setPostId] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null); // SEO用途に維持
  const [existingLinkToken, setExistingLinkToken] = useState<string | null>(
    null
  ); // 既存token再利用

  // form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
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

  // カバー
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // サイドUI
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [panelMode, setPanelMode] = useState<"toc" | "tpl">("toc");

  // テンプレ上書き確認
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);
  const pendingInsertMdRef = useRef<string | null>(null);

  // 公開ダイアログ
  const [publishOpen, setPublishOpen] = useState(false);
  const [visDraft, setVisDraft] = useState<
    "draft" | "public" | "group" | "link"
  >("draft");
  const [groupId, setGroupId] = useState<string>("");

  // ---- dirty 管理（初期値差分） ----
  const initialRef = useRef<{
    title: string;
    body: string;
    coverUrl: string | null;
    tags: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 初期ロード（idで取得）
  useEffect(() => {
    (async () => {
      try {
        const { data: me } = await supabase.auth.getUser();
        const u = me.user;
        if (!u) {
          router.replace(
            `/auth/login?next=/posts/${encodeURIComponent(idParam)}/edit`
          );
          return;
        }
        setUid(u.id);

        // 投稿（id）で取得 ※ link_token を追加
        const { data: post, error: pErr } = await supabase
          .from("posts")
          .select(
            "id, author_id, title, slug, body_md, cover_image_url, visibility, group_id, link_token"
          )
          .eq("id", idParam)
          .maybeSingle();

        if (pErr || !post) {
          setErr(pErr?.message || "投稿が見つかりませんでした。");
          setLoading(false);
          return;
        }
        if (post.author_id !== u.id) {
          setErr("この投稿を編集する権限がありません。");
          setLoading(false);
          return;
        }

        setPostId(post.id);
        setOriginalSlug(post.slug);
        setExistingLinkToken(post.link_token ?? null);
        setTitle(post.title ?? "");
        setBody(post.body_md ?? "");
        setCurrentCoverUrl(post.cover_image_url ?? null);
        setVisDraft((post.visibility as any) ?? "draft");
        setGroupId(post.group_id ?? "");

        // 既存タグ
        const { data: t } = await supabase
          .from("post_tags")
          .select("tag_name")
          .eq("post_id", post.id);
        const tagsInit =
          t && Array.isArray(t) ? t.map((x: any) => x.tag_name).join(" ") : "";
        setTagsInput(tagsInit);

        // groups
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

        // 初期スナップショット
        initialRef.current = {
          title: post.title ?? "",
          body: post.body_md ?? "",
          coverUrl: post.cover_image_url ?? null,
          tags: tagsInit,
        };
      } catch (e: any) {
        setErr(e?.message ?? "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, idParam]);

  // dirty 判定（初期との差 + pendingUploads）
  useEffect(() => {
    if (!initialRef.current) return;
    const base = initialRef.current;
    const changedTitle = (title ?? "") !== (base.title ?? "");
    const changedBody = (body ?? "") !== (base.body ?? "");
    const tagsNow = tagsInput.trim();
    const changedTags = tagsNow !== (base.tags ?? "");
    const addedCover = !!coverFile;
    const removedCover = base.coverUrl && !coverFile && !currentCoverUrl;
    const pendingUploads = editorRef.current?.hasPendingUploads?.() === true;

    setIsDirty(
      changedTitle ||
        changedBody ||
        changedTags ||
        addedCover ||
        removedCover ||
        pendingUploads
    );
  }, [title, body, tagsInput, coverFile, currentCoverUrl]);

  // ストレージ共通
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

  // カバー画像
  const handlePickCover = () => coverInputRef.current?.click();
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
  };
  const clearCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setCurrentCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ===== 更新 / 公開（slug衝突リトライ + link_token再利用） =====
  const doSubmit = async () => {
    if (!uid || !postId) return;
    setErr(null);
    setInfo(null);
    setSaving(true);

    try {
      const finalMd =
        (await editorRef.current?.exportMarkdownWithUploads(
          uploadToSupabase
        )) ?? body;
      const readMinutes = estimateReadMinutes(finalMd);

      // カバー画像アップロード
      let coverUrl: string | null = currentCoverUrl;
      if (coverFile) coverUrl = await uploadToSupabase(coverFile);

      // 希望 slug 候補（SEO用途）。originalSlug 未定義でも安全に。
      const desired = originalSlug
        ? title
          ? slugify(title)
          : originalSlug
        : slugify(title || "untitled");
      const isPublished = visDraft !== "draft";

      // link_token 方針：link以外→null / link→既存 or 新規
      const nextLinkToken =
        visDraft === "link" ? existingLinkToken || randomBase64Url(20) : null;

      const tryUpdate = async (slugCandidate: string) => {
        const { data, error } = await supabase
          .from("posts")
          .update({
            title,
            slug: slugCandidate,
            body_md: finalMd,
            cover_image_url: coverUrl,
            visibility: visDraft,
            link_token: nextLinkToken,
            group_id: visDraft === "group" ? groupId : null,
            is_published: isPublished,
            read_minutes: readMinutes,
            published_at: isPublished ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId)
          .select("id, slug, link_token")
          .single();
        return { data, error };
      };

      // まず希望slugで更新
      let res = await tryUpdate(desired);

      // 一意制約衝突(23505) → サフィックスで最大2回リトライ
      const isUniqueErr = (e: any) =>
        e &&
        (e.code === "23505" ||
          String(e.message || "").includes("duplicate key"));
      if (res.error && isUniqueErr(res.error)) {
        const s1 = `${desired}-${Date.now().toString(36).slice(-4)}`;
        res = await tryUpdate(s1);
        if (res.error && isUniqueErr(res.error)) {
          const s2 = `${desired}-${Math.random().toString(36).slice(2, 6)}`;
          res = await tryUpdate(s2);
        }
      }
      if (res.error) throw res.error;

      const saved = res.data!;
      setPublishOpen(false);
      setIsDirty(false);
      setExistingLinkToken(saved.link_token ?? null);

      // タグ反映（任意）
      if (tags.length) {
        const { error: tagErr } = await supabase.rpc("upsert_post_tags", {
          p_post_id: saved.id,
          p_tag_names: tags,
        });
        if (tagErr)
          setInfo(`更新は成功しましたが、タグの反映に失敗: ${tagErr.message}`);
      }

      // 遷移は id ベース
      if (visDraft === "link") {
        const share = `${window.location.origin}/posts/${saved.id}?token=${saved.link_token}`;
        await navigator.clipboard.writeText(share).catch(() => {});
        router.replace(`/posts/${saved.id}?token=${saved.link_token}`);
      } else {
        router.replace(`/posts/${saved.id}`);
      }
    } catch (e: any) {
      setErr(e?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  // ===== テンプレ挿入 =====
  const tryInsertTemplate = (md: string) => {
    if (body.trim().length === 0) {
      setBody(md);
      return;
    }
    pendingInsertMdRef.current = md;
    setConfirmOverwriteOpen(true);
  };
  const confirmOverwrite = () => {
    if (pendingInsertMdRef.current) {
      setBody(pendingInsertMdRef.current);
      pendingInsertMdRef.current = null;
    }
    setConfirmOverwriteOpen(false);
  };

  // ===== 下書き保存（離脱ガード用） =====
  const saveDraftOnly = useCallback(async () => {
    if (!uid || !postId) throw new Error("auth required");

    setErr(null);
    setSaving(true);
    try {
      const finalMd =
        (await editorRef.current?.exportMarkdownWithUploads(
          uploadToSupabase
        )) ?? body;
      const readMinutes = estimateReadMinutes(finalMd);

      let coverUrl: string | null = currentCoverUrl;
      if (coverFile) coverUrl = await uploadToSupabase(coverFile);

      const { error } = await supabase
        .from("posts")
        .update({
          title,
          body_md: finalMd,
          cover_image_url: coverUrl,
          visibility: "draft",
          group_id: null,
          is_published: false,
          read_minutes: readMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
      if (error) throw error;

      setInfo("下書きとして保存しました。");
    } finally {
      setSaving(false);
    }
  }, [uid, postId, title, body, coverFile, currentCoverUrl]);

  // ===== 離脱ガード =====
  const leave = useLeaveConfirm({
    isDirty,
    onSaveDraft: saveDraftOnly,
    canSave: !!uid,
  });

  // ===== レイアウト寸法 =====
  const railW = 72;
  const paneW = 300;
  const editorMax = 780;
  const sideW = menuExpanded ? railW + paneW : railW;

  // ===== TOC =====
  const toc: TocItem[] = useMemo(() => {
    const out: TocItem[] = [];
    const re = /^(#{1,3})\s+(.+?)\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const level = m[1].length as 1 | 2 | 3;
      const text = m[2].replace(/[#*_`]/g, "").trim();
      out.push({ level, text });
    }
    return out;
  }, [body]);

  const scrollToHeading = (idx: number) => {
    const root = document.querySelector(
      ".tiptap-content"
    ) as HTMLElement | null;
    if (!root) return;
    const els = Array.from(
      root.querySelectorAll("h1, h2, h3")
    ) as HTMLElement[];
    const el = els[idx];
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          読み込み中…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {/* 操作バー（上） */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          読了目安: {estimateReadMinutes(body)} 分
        </Typography>
        <Button
          component={NextLink}
          href="/me"
          variant="outlined"
          color="inherit"
          sx={{ mr: 1 }}
        >
          閉じる
        </Button>
        <Button
          variant="contained"
          onClick={() => setPublishOpen(true)}
          disabled={saving || !title || !body}
        >
          更新 / 公開
        </Button>
      </Stack>

      {/* グリッド：左サイド + 右メイン */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `${sideW}px 1fr`,
          gap: 2,
          transition: "grid-template-columns .2s ease",
          alignItems: "start",
        }}
      >
        {/* 左：縦レール + パネル */}
        <Box
          sx={{
            position: "sticky",
            top: 88,
            height: "calc(100dvh - 136px)",
            display: "grid",
            gridTemplateColumns: `${railW}px ${menuExpanded ? paneW : 0}px`,
            gap: 1,
            transition: "grid-template-columns .2s ease",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 1,
              bgcolor: "rgba(255,255,255,0.7)",
              backdropFilter: "saturate(180%) blur(12px)",
            }}
          >
            <Tooltip title="目次" placement="right">
              <IconButton
                size="small"
                color={
                  panelMode === "toc" && menuExpanded ? "primary" : "default"
                }
                onClick={() => {
                  setPanelMode("toc");
                  setMenuExpanded(true);
                }}
                sx={{ mb: 1 }}
              >
                <TocIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="テンプレート" placement="right">
              <IconButton
                size="small"
                color={
                  panelMode === "tpl" && menuExpanded ? "primary" : "default"
                }
                onClick={() => {
                  setPanelMode("tpl");
                  setMenuExpanded(true);
                }}
              >
                <MenuBookIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>

          {menuExpanded && (
            <Paper
              variant="outlined"
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "rgba(255,255,255,0.7)",
                backdropFilter: "saturate(180%) blur(12px)",
              }}
            >
              {/* ヘッダー */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 1 }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {panelMode === "toc" ? "目次" : "テンプレート"}
                </Typography>
                <Tooltip title="閉じる">
                  <IconButton
                    size="small"
                    onClick={() => setMenuExpanded(false)}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider />

              {/* 中身 */}
              <Box sx={{ flex: 1, overflow: "auto" }}>
                {panelMode === "toc" ? (
                  <List dense sx={{ py: 0.5 }}>
                    {toc.length === 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ px: 2, py: 1 }}
                      >
                        見出し（# / ## / ###）を入力すると目次が表示されます
                      </Typography>
                    )}
                    {toc.map((t, idx) => (
                      <ListItemButton
                        key={`${t.level}-${idx}-${t.text}`}
                        onClick={() => scrollToHeading(idx)}
                        sx={{
                          pl: t.level === 1 ? 1.5 : t.level === 2 ? 3 : 4.5,
                          py: 0.75,
                        }}
                      >
                        <ListItemText
                          primary={t.text}
                          primaryTypographyProps={{
                            noWrap: true,
                            title: t.text,
                            fontSize:
                              t.level === 1
                                ? "0.95rem"
                                : t.level === 2
                                ? "0.9rem"
                                : "0.85rem",
                            fontWeight: t.level === 1 ? 700 : 500,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                ) : (
                  <List dense sx={{ py: 0.5 }}>
                    {SAMPLES.map((s) => (
                      <ListItemButton
                        key={s.label}
                        disableRipple
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          alignItems: "center",
                          columnGap: 1,
                          py: 0.75,
                          cursor: "default",
                        }}
                      >
                        <ListItemText
                          primary={s.label}
                          primaryTypographyProps={{
                            noWrap: true,
                            title: s.label,
                          }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => tryInsertTemplate(s.md)}
                        >
                          挿入
                        </Button>
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          )}
        </Box>

        {/* 右：本文 */}
        <Box>
          {/* タイトル */}
          <Box sx={{ mb: 1.5, display: "flex", justifyContent: "center" }}>
            <InputBase
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力"
              inputProps={{ "aria-label": "title" }}
              sx={{
                width: "100%",
                maxWidth: editorMax,
                fontWeight: 800,
                fontSize: { xs: "1.4rem", sm: "1.8rem" },
                lineHeight: 1.25,
                px: 0,
                py: 1,
                border: "none",
                outline: "none",
                "& input": { border: "none", outline: "none" },
                background: "transparent",
              }}
            />
          </Box>

          {/* 本文 */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ width: "100%", maxWidth: editorMax }}>
              <RichEditor
                ref={editorRef}
                valueMd={body}
                onChangeMd={setBody}
                placeholder="大見出し、引用、リスト、画像、リンクに対応。画像は保存時に自動アップロードされます。"
              />
            </Box>
          </Box>

          {err && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {err}
            </Alert>
          )}
          {info && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {info}
            </Alert>
          )}
        </Box>
      </Box>

      {/* 公開設定ダイアログ */}
      <Dialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>公開設定を選択</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={visDraft}
            onChange={(e) => setVisDraft(e.target.value as any)}
            sx={{ mt: 1 }}
          >
            <FormControlLabel
              value="draft"
              control={<Radio />}
              label="下書き（非公開）"
            />
            <FormControlLabel
              value="public"
              control={<Radio />}
              label="完全公開"
            />
            <FormControlLabel
              value="link"
              control={<Radio />}
              label="リンク限定公開"
            />
            <FormControlLabel
              value="group"
              control={<Radio />}
              label="グループ限定公開"
            />
          </RadioGroup>

          {visDraft === "group" && (
            <FormControl fullWidth sx={{ mt: 2 }}>
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

          {/* タグ */}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="タグ（カンマ or スペース区切り）"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="例）ドライヤー くせ毛 速乾 サロンワーク"
            />
            {tags.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {tags.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </Stack>
            )}
          </Box>

          {/* カバー画像 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              カバー画像（任意）
            </Typography>
            {coverPreview || currentCoverUrl ? (
              <Paper
                variant="outlined"
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 2,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview || currentCoverUrl || undefined}
                  alt="cover preview"
                  style={{
                    width: "100%",
                    display: "block",
                    maxHeight: 320,
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>戻る</Button>
          <Button
            onClick={doSubmit}
            variant="contained"
            disabled={saving || !title || !body}
          >
            更新する
          </Button>
        </DialogActions>
      </Dialog>

      {/* テンプレ上書き警告 */}
      <Dialog
        open={confirmOverwriteOpen}
        onClose={() => setConfirmOverwriteOpen(false)}
      >
        <DialogTitle>本文を上書きします</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            現在の本文は消えて、選択したテンプレート内容に置き換わります。よろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOverwriteOpen(false)}>
            キャンセル
          </Button>
          <Button color="error" variant="contained" onClick={confirmOverwrite}>
            上書きする
          </Button>
        </DialogActions>
      </Dialog>

      {/* 離脱ガード */}
      <LeaveConfirmDialog
        open={leave.dialogOpen}
        canSave={leave.canSave}
        isSaving={leave.isSaving}
        onCancel={leave.cancelLeave}
        onDiscard={leave.confirmDiscardAndLeave}
        onSaveAndLeave={leave.confirmSaveAndLeave}
      />
    </Box>
  );
}
