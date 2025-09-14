// app/posts/new/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const RichEditor = dynamic(() => import("@/app/_components/RichEditor"), {
  ssr: false,
});

type Group = { id: string; name: string };

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

/* ===== 記入例タブ（プロ向けテンプレ） ===== */
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

## 3) リスク・禁忌
- 皮膚刺激歴：無 / 有（部位＿/反応＿）
- 注意薬剤：＿＿＿（例：過硫酸塩、シアノアクリレート等）
- 施術NG：＿＿＿（理由）

## 4) 施術方針（簡潔に）
- メイン：＿＿＿＿（例：酸熱／中性矯正／ブリーチ1回）
- 補助：＿＿＿＿（例：前処理PPT／バッファー）
- 仕上げ：＿＿＿＿（例：90%ドライ→耐湿スプレー）

## 5) アフター・次回来店
- ホームケア：朝＿＿＿／夜＿＿＿／週1＿＿＿
- 次回：＿＿週間後（目的：補正／色味調整／土台作り）
- KPI：持ち＿＿週・再現時間＿＿分・満足度＿＿/10
`,
  },
  {
    label: "ヘア：ブリーチ設計",
    md: `# ブリーチ設計（黒染め履歴ありの想定）

## 目的・KPI
- 目標明度：10〜11Lv／オレンジ残り最小
- ダメージ指標：ウェット伸び＜5%、ドライ弾力維持

## 設計
- 薬剤：過硫酸塩系＋6%（根元4.5%）、プレックス1.5%
- 粘度：耳上硬め、ネープ〜中間はやや緩め
- ブロッキング：5分割、フェイスライン先行
- 中間水洗：8–10分時点、pHバッファ 4.5

## 進行
1. 既染部先行→根元は5–8分遅らせ
2. 浮きやすい部位にフィルム＋保温は局所のみ
3. 中間水洗→再塗布（必要部位）

## 仕上げ・トナー
- 8:1:1（V/アッシュ：クリア：バッファ）5分
- 乳化→酸リンス→ドライ前オイル

## 注意・禁忌
- 皮膚既往歴／薬剤滞留時間の上限管理
- 黒染め履歴部に還元チェック→反応過多なら段階除去に切替
`,
  },
  {
    label: "ヘア：中性ストレート（くせ中〜強）",
    md: `# 中性矯正プロトコル（ショート〜ミディアム）

## 素材評価
- うねり：3/5　捻転：2/5　撥水：中
- 既矯正：耳後ろのみ 6ヶ月前

## 1剤
- 中性〜微アルカリ pH6.8–7.2、GMT少量ブレンド
- 塗布：生還元ゾーンに限定、既矯正部は油性バリア

## 反応管理
- 目視：面の乱反射→整列変化で判定
- テスト：数本スルー時の伸び 20–30%

## アイロン
- 180–185℃、スルー1.5〜2回、テンション小さめ
- 前髪・顔周りは面優先、角度管理

## 2剤・後処理
- ブロム酸→処理時間厳守→酸リンス→CMC補充

## リスク管理
- 既矯正部の重ねを避ける／前処理タンパク過多の脆化に注意
`,
  },
  {
    label: "ネイル：ワンカラー時短×持ち",
    md: `# ジェルワンカラー：時短&持ち最適化

## 所要・単価目安
- 60分 / ¥¥¥　目標リピ率：85%

## 工程
1. プレパ（甘皮/サイドウォール）5–7分
2. サンディング：180Gで均一、ダスト完全除去
3. 脱脂→ベース薄塗り→硬化
4. 2層色ムラ補正：1層目7割、2層目でエッジ形成
5. トップ：フォルム整え、先端シーリング

## 品質管理
- 浮き率＜5%、リペア戻り率モニタ
- 皮膚接触ゼロ、キューティクルライン0.5mm

## 禁忌・対応
- 緑膿菌疑い→即中止・医療案内
- アレルギー反応→材料変更／パッチ推奨
`,
  },
  {
    label: "アイ：まつパ（ラッシュリフト）",
    md: `# まつ毛パーマ：安定カール再現

## 事前評価
- 太さ：中　長さ：8–10mm　逆さまつ毛：軽度

## 設計
- ロッド：Cカール相当、インナー短め配置
- 1剤：チオ系低刺激、塗布量は根元1/3メイン
- 2剤：ブロム酸系、過収斂回避

## 進行
1. 皮膚保護→ロッド装着→テンション均一
2. 1剤 8–10分、拭き取り完全→2剤 6–8分
3. ブラッシング整列→乾燥→コーティング

## リスク
- ケミカル刺激歴／粘膜接触の回避
- 左右差はロッド選定/塗布時間で微調整
`,
  },
  {
    label: "フェイシャル：毛穴×鎮静プロトコル",
    md: `# フェイシャル：毛穴集中（角栓軟化→鎮静）

## 禁忌確認
- 強い炎症性ニキビ／レチノール高濃度使用中／皮膚科加療中

## 流れ（60分）
1. クレンジング→酵素洗浄（2–3分）
2. スチーム5分（敏感肌はオフ）
3. 超音波 or 吸引：低圧・短時間
4. 鎮静パック（PCA/パンテノール）10分
5. 導入（NA/B5）→保湿→UV

## ホームケア指導
- 酵素洗顔は週1、レチノール夜のみ、PA++++
- 触らない・擦らない・温冷差に注意
`,
  },
  {
    label: "写真/SNS：撮影テンプレ",
    md: `# 撮影テンプレ（再現可能な一枚）

## 事前
- 背景：無彩色、逆光回避、蛍光灯OFFで色被り防止
- 構図：ビフォーは正対、アフターは3/4斜め

## 設定
- 露出−0.3〜−0.7、WBオート→微補正
- ピント：前髪・艶のハイライトに

## 投稿メモ
- 1枚目：アフター（情報最小）
- 2枚目：工程/使用剤
- 3枚目：ホームケア提案と来店周期
- ハッシュタグ：地域×メニュー×悩み＋2–3個で十分
`,
  },
  {
    label: "メニュー設計：単価UP（自然）",
    md: `# 単価アップ設計（押し売りゼロ）

## 入口単価→目標
- 例）¥7,000 → ¥9,500（3ヶ月で）

## バンドル例
- カット＋質感補正トリート＋耐湿仕上げ（所要+10分）
- ブリーチ系：前処理PPT＋中間水洗＋プレックス

## トークの順序
1. 悩みの再定義（数字化）→ 2. 体験提案（試すだけ） → 3. 家でも再現できる道筋提示

## 指標
- 客単価、セット率、次回予約率、返品率
`,
  },
  {
    label: "キャンペーン運用：在庫×集客",
    md: `# 月次キャンペーン運用（在庫連動）

## 目標
- リピ客の来店周期短縮／ホームケア導入率UP

## 企画例
- 梅雨：耐湿ライン体験セット（ミニ＋施術バンドル）
- ブリーチ月：紫シャンプー2本目割

## 運用
- 既存客LINE：告知→2回目リマインド（来店10日前）
- SNS：前後比較の“結果”を1枚目に
- 在庫閾値：残15でポップ作成→残8でストーリー告知

## 効果測定
- 同月対比：客単価／再来率／在庫回転
`,
  },
  {
    label: "リスク&衛生チェックリスト",
    md: `# リスク・衛生チェック（毎日運用）

## 衛生
- 金属/刃物：超音波洗浄→消毒→乾燥→密閉
- タオル：使用区画分け、湿庫内温湿度ログ

## 化学薬剤
- ロット/開封日記録、アレルゲン掲示
- MSDS管理と避難経路周知

## 事故対応
- 皮膚刺激：即時中止→洗浄→冷却→記録→連絡
- 目入：洗眼→医療連携→報告書
`,
  },
];

export default function NewPostPage() {
  const router = useRouter();
  const editorRef = useRef<RichEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  // form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(""); // 本文Markdown
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

  // auth required + groups
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace("/auth/login?next=/posts/new");
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
  }, [router]);

  // ストレージアップロード共通
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

  // カバー画像ハンドラ
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
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // 記入例挿入（上書き）フロー
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (!uid) return;
    if (visibility === "group" && !groupId) {
      setErr("グループ限定公開を選択した場合は、グループを選んでください。");
      return;
    }
    setSaving(true);

    // 本文の一時画像アップロード & 置換
    const finalMd =
      (await editorRef.current?.exportMarkdownWithUploads(uploadToSupabase)) ??
      body;
    const readMinutes = estimateReadMinutes(finalMd);

    // カバー画像アップロード（任意）
    let coverUrl: string | null = null;
    if (coverFile) {
      try {
        coverUrl = await uploadToSupabase(coverFile);
      } catch (e: any) {
        setSaving(false);
        setErr(`カバー画像のアップロードに失敗しました：${e?.message ?? ""}`);
        return;
      }
    }

    let slug = slugify(title || "untitled");
    const baseInsert = async () => {
      const isPublished = visibility !== "draft";
      const linkToken = visibility === "link" ? randomBase64Url(20) : null;
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: uid,
          title,
          slug,
          body_md: finalMd,
          cover_image_url: coverUrl,
          visibility,
          link_token: linkToken,
          group_id: visibility === "group" ? groupId : null,
          is_published: isPublished,
          read_minutes: readMinutes,
          published_at: isPublished ? new Date().toISOString() : null,
        })
        .select("id, slug, link_token")
        .single();
      return { data, error };
    };

    let { data, error } = await baseInsert();
    if (error && (error as any).code === "23505") {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      ({ data, error } = await baseInsert());
    }
    if (error) {
      setSaving(false);
      setErr(error.message || "保存に失敗しました。");
      return;
    }

    // タグ反映
    if (tags.length) {
      const { error: tagErr } = await supabase.rpc("upsert_post_tags", {
        p_post_id: data!.id,
        p_tag_names: tags,
      });
      if (tagErr)
        setInfo(
          `投稿は保存しましたが、タグの反映に失敗しました: ${tagErr.message}`
        );
    }

    setSaving(false);

    if (visibility === "link") {
      const share = `${window.location.origin}/posts/${data!.slug}?token=${
        data!.link_token
      }`;
      await navigator.clipboard.writeText(share).catch(() => {});
      router.replace(`/posts/${data!.slug}?token=${data!.link_token}`);
    } else {
      router.replace(`/posts/${data!.slug}`);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        "& .MuiOutlinedInput-root": { borderRadius: 4 },
        "& .MuiOutlinedInput-root fieldset": { borderRadius: 4 },
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

          {/* 本文：左 / 記入例：右（右は sticky 追従 + 内部スクロール） */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: rightOpen
                ? { xs: "1fr", md: "minmax(0,1fr) minmax(0,1fr)" } // 完全1:1（押し出され防止）
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

            {/* 右：記入例（sticky 追従 + 内部スクロール） */}
            {rightOpen && (
              <Box
                sx={{
                  position: { md: "sticky" },
                  top: { xs: 0, md: 88 }, // ヘッダー分オフセット（必要なら調整）
                  alignSelf: "flex-start",
                  height: {
                    md: "calc(100vh - 88px - 16px)", // 画面高 - ヘッダー - 余白
                  },
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

                  {/* 内部スクロール領域 */}
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

                    {/* 執筆アドバイス（読み物のみ） */}
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
