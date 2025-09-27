"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  useMediaQuery,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
} from "@mui/material";
import NextLink from "next/link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TocIcon from "@mui/icons-material/Toc";
import MenuIcon from "@mui/icons-material/Menu";
import PublishIcon from "@mui/icons-material/Publish";
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

/* ===== 記入例テンプレ（最小構成） ===== */
const SAMPLES: { label: string; md: string }[] = [
  /* ===== 学生・若手向け ===== */
  {
    label: "学生：学びログ（毎日の小さな発見）",
    md: `# 学びログ（デイリー）

> 目的：気づきを“言語化→再現”まで落とし込む。所要 5分。

## 今日のトピック
- 授業/サロン見学/動画：＿＿＿＿＿＿
- キーワード：＿＿＿＿＿＿（例：前上がり/放置タイム/面の出し方）

## 観察→仮説
- 観察：＿＿＿＿＿＿
- うまくいった/課題：＿＿＿＿＿＿
- 仮説：＿＿＿＿＿＿（なぜ？）

## ミニ実験（明日やる1つ）
- 実験内容：＿＿＿＿＿＿
- 期待する変化：＿＿＿＿＿＿

## 参考/メモ
- 参考リンク：＿＿＿＿＿＿
- 用語メモ：＿＿＿＿＿＿
`,
  },
  {
    label: "学生：作品撮り（プラン→撮影→振り返り）",
    md: `# 作品撮りプラン

## 1) 目的・世界観
- 目的：＿＿＿＿（例：就活ポートフォリオ）
- ムード/ワード：＿＿＿＿（例：透明感/朝の光）

## 2) 設計
- モデル：髪質＿＿/長さ＿＿/似合わせポイント＿＿
- カラー：ベース＿＿/配合＿＿/放置＿＿/後処理＿＿
- スタイリング：質感＿＿/使用アイテム＿＿/手順＿＿
- メイク&衣装：＿＿＿＿

## 3) 撮影
- 光：自然光/定常光/ストロボ　位置＿＿
- 構図：バストアップ/横顔/手元　チェック＿＿
- NG避け：耳後ろのもたつき/根元の割れ 等

## 4) 振り返り
- 良かった：＿＿＿＿
- 課題：＿＿＿＿
- 次回改善1つ：＿＿＿＿
`,
  },
  {
    label: "アシスタント：施術メモ（シャンプー/ブロー）",
    md: `# 施術メモ（アシスタント）

## お客様情報（匿名可）
- 髪質：太さ＿＿/量＿＿/癖＿＿/ダメージ＿＿
- NG/注意：＿＿＿＿

## 手順（時短×快適）
- シャンプー：流し＿＿/圧＿＿/指の角度＿＿/所要＿＿
- トリートメント：塗布量＿＿/揉み込み＿＿/乳化＿＿
- タオルドライ：水分残し目標＿＿（握って滴らない程度）
- ブロー：面出し/根元方向づけ/仕上げ温度＿＿

## フィードバック
- 先輩から：＿＿＿＿
- 自己評価（10点満点）：＿＿点　理由：＿＿＿＿
- 次回の一点改善：＿＿＿＿
`,
  },
  {
    label: "新人スタイリスト：メニュー設計（似合わせカット）",
    md: `# 似合わせカット設計

## 目標
- ビフォー→アフターの“印象語”：＿＿＿＿（例：幼→大人/重→軽）
- 所要：60分以内

## 素材・制約
- 骨格：前頭部＿＿/後頭部＿＿/エラ＿＿
- 毛流：つむじ＿＿/生えグセ＿＿
- クセ：波状/捻転/直毛　強度＿＿

## 設計
- ベース：前上がり/平行/前下がり　角度＿＿
- 量感：セニング％＿＿/スライド箇所＿＿
- 前髪：幅＿＿/厚み＿＿/透け感＿＿
- 仕上げ：質感＿＿/アイロン温度＿＿

## 検証
- 再現課題：＿＿＿＿
- 家でのケア指示：＿＿＿＿
`,
  },

  /* ===== ヘア（プロ用） ===== */
  {
    label: "プロ：ブリーチ ワンブリ設計（黒染め疑いなし）",
    md: `# ブリーチ設計（ワンブリ）

## 目的・KPI
- 目標明度：10–11Lv
- 均一度：根元–中間–毛先の差△1Lv以内
- ダメージ指標：ウェット伸び＜5%

## 素材診断
- 既染：＿＿＿（無/茶系/白髪染め）
- 蓄積：ポリ/金属　有/無　疑い根拠：＿＿
- 髪質：太さ＿＿/撥水＿＿/履歴＿＿

## 設計
- 薬剤：＿＿g（粉）＋＿＿g（OXY）＝＿＿%
- 保護：＿＿（前処理/キト/油分）
- 置き順：根元→中間→毛先 or 逆　理由：＿＿
- 放置：＿＿分　チェック：＿＿分間隔
- 後処理：バッファー＿＿/pH＿＿/タンパク補充＿＿

## トラブル回避
- 熱源使用：有/無　温度＿＿
- 黒染め反応サイン：＿＿→出たら中断/リムーブ検討

## 仕上がり検証
- 残留：黄/橙 指数＿＿　次工程：＿＿（on color/2ブリ）
`,
  },
  {
    label: "プロ：縮毛矯正（中性〜弱酸性・中〜強クセ）",
    md: `# 縮毛矯正プロトコル

## 素材評価
- うねり＿＿/捻転＿＿/連珠＿＿　（5段階）
- 撥水＿/親水＿　既ダメージ：中間＿＿/毛先＿＿
- 既矯正：周期＿＿/部位＿＿

## 設計
- 1剤：pH＿＿/還元剤比率＿＿/塗布量＿＿
- 反応：テスト毛＿＿（タイム＿＿分）
- 流し：乳化＿＿/還元止め＿＿
- アイロン：温度＿＿/パネル幅＿＿/テンション指針＿＿
- 2剤：濃度＿＿/放置＿＿

## リスク管理
- ビビり予兆：＿＿→対応：中間処理/温度下げ/引き直し
- 前処理/中間処理：＿＿

## 仕上がり検証＆アフター
- 伸び感：根元＿＿/中間＿＿/毛先＿＿
- ホームケア：＿＿（乾かし方/温度/間隔）
`,
  },
  {
    label: "プロ：メンズパーマ（波巻き×ツイストMIX）",
    md: `# メンズパーマ設計

## 目的
- 雰囲気ワード：＿＿＿＿（例：ラフ/色気）
- セット時間：5分以内

## 設計
- ロッド：直径＿＿/本数＿＿/配置図＿＿
- 薬剤：還元剤＿＿/pH＿＿/放置＿＿
- 中間処理：＿＿　2剤：＿＿
- 乾かし方：＿＿　スタイリング剤：＿＿

## 検証
- 取れやすい部位：＿＿　次回修正：＿＿
`,
  },

  /* ===== ネイル / アイラッシュ / エステ ===== */
  {
    label: "ネイル：ワンカラー（60分）最短動線",
    md: `# ネイル：ワンカラー時短プロトコル

## 目標
- 施術60分 / 2–3週間浮きなし

## 手順（所要）
1. カウンセリング（5）：NG/好み/前回トラブル
2. プレパ（15）：甘皮処理/サンディング圧＿＿
3. ベース（10）：厚み指標＿＿/流し込み＿＿
4. カラー（15）：2度塗り/ムラ防止＿＿
5. トップ（10）：艶の山位置＿＿/硬化＿＿
6. 仕上げ（5）：キューティクルオイル/注意点

## リスク
- 浮き/リフトの兆候：＿＿→対応：＿＿

## アフター
- 次回周期/ホームケア：＿＿
`,
  },
  {
    label: "アイラッシュ：デザイン記録（再現テンプレ）",
    md: `# まつげデザイン記録

## 目的
- 印象：＿＿（ナチュラル/セクシー/キュート）
- 持ち：＿＿週間

## 設計
- カール：＿＿　長さ：＿＿　太さ：＿＿
- 本数：＿＿　配列：目頭＿＿→中央＿＿→目尻＿＿
- 接着：根元から＿＿mm/角度＿＿

## 検証
- 取れやすい部位：＿＿　アレルギー反応：無/有（＿＿）

## 次回提案
- 本数±＿＿/カール変更＿＿/メンテ周期＿＿
`,
  },
  {
    label: "エステ：フェイシャル（毛穴/くすみ）",
    md: `# フェイシャル設計

## ゴール
- 即時効果：トーン↑/なめらかさ↑
- 継続指標：水分量/皮脂量 2週間後再測定

## 設計
- クレンジング：＿＿（時間＿＿）
- 角質ケア：＿＿（ピーリング種類/濃度/時間）
- マッサージ：圧＿＿/方向＿＿/禁忌＿＿
- パック：＿＿（時間＿＿）
- 仕上げ：＿＿（日中/SPF）

## 注意/禁忌
- 妊娠/皮膚疾患/薬服用：＿＿

## ホームケア指示
- 朝：＿＿　夜：＿＿
`,
  },

  /* ===== 経営・運用 ===== */
  {
    label: "経営：新メニュー導入シート（小さく検証）",
    md: `# 新メニュー導入

## 仮説
- 誰のどんな課題？：＿＿＿＿
- 価値提案（30字）：＿＿＿＿

## ミニMVP
- 提供条件：所要＿＿/原価＿＿/材料＿＿
- 価格A/Bテスト：A＿＿円 / B＿＿円
- 予約導線：＿＿（POP/ストーリー/DM）

## KPI（2週間）
- 予約数＿＿　客単価＋＿＿円　満足度＿＿/10

## 学び/改善
- 学び：＿＿　次アクション：＿＿（1つ）
`,
  },
  {
    label: "経営：失客分析（原因→対策）",
    md: `# 失客分析

## 期間・対象
- 期間：＿＿～＿＿
- 件数：＿＿件

## 分類
- 技術/接客/予約間隔/価格/立地/その他（％）：＿＿

## インサイト
- 顧客の一言：＿＿＿＿
- 真因仮説：＿＿＿＿

## 対策（優先度高→低）
1. ＿＿＿＿（締切＿＿/担当＿＿）
2. ＿＿＿＿
3. ＿＿＿＿

## 効果測定
- 3ヶ月後：再来率＋＿＿pt / ネガ減少＿＿件
`,
  },
  {
    label: "運用：口コミ返信テンプレ（誠実×再来導線）",
    md: `# 口コミ返信テンプレ

## ポジティブ
- 冒頭感謝：＿＿＿＿
- 個別要素言及：＿＿＿＿（カットの軽さ 等）
- 次回提案：＿＿＿＿（季節/イベント）
- 締め：＿＿＿＿

## ネガティブ
- 率直な謝罪：＿＿＿＿
- 事実確認→改善：＿＿＿＿
- リカバリー提案（期限/担当）：＿＿＿＿
- 締め：＿＿＿＿
`,
  },
  {
    label: "チーム：練習会レポ（共有→定着）",
    md: `# 練習会レポート

## 目的・テーマ
- ＿＿＿＿

## 実施メニュー/手順
- ＿＿＿＿

## 共有したコツ（3つ）
- 1) ＿＿＿＿
- 2) ＿＿＿＿
- 3) ＿＿＿＿

## つまずき/改善
- ＿＿＿＿

## 次回までの宿題（1人1つ）
- ＿＿＿＿
`,
  },

  /* ===== 汎用ショート ===== */
  {
    label: "5分プロトタイプ（何でも）",
    md: `# 5分プロトタイプ

## 目的（30字）
- ＿＿＿＿

## 最小ステップ（3つ）
1) ＿＿＿＿（今日）
2) ＿＿＿＿（明日）
3) ＿＿＿＿（今週）

## 測る指標（1つ）
- ＿＿＿＿（例：予約1件/DM返信3件）

## 結果・学び
- ＿＿＿＿

## 次の一手
- ＿＿＿＿
`,
  },
];

export default function NewPostPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const isSmDown = useMediaQuery("(max-width:600px)");
  const isMdDown = useMediaQuery("(max-width:900px)");

  const editorRef = useRef<RichEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

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

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // サイド（目次/テンプレ）
  const [menuExpanded, setMenuExpanded] = useState(true); // PC用
  const [panelMode, setPanelMode] = useState<"toc" | "tpl">("toc");
  const [sideOpen, setSideOpen] = useState(false); // モバイルDrawer

  // 上書き確認（テンプレ挿入）
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);
  const pendingInsertMdRef = useRef<string | null>(null);

  // 公開ダイアログ
  const [publishOpen, setPublishOpen] = useState(false);
  const [visDraft, setVisDraft] = useState<
    "draft" | "public" | "group" | "link"
  >("draft");
  const [groupId, setGroupId] = useState<string>("");

  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    const dirty =
      !!title.trim() ||
      !!body.trim() ||
      !!coverFile ||
      editorRef.current?.hasPendingUploads?.() === true;
    setIsDirty(dirty);
  }, [title, body, coverFile]);

  // // 認証＋所属グループ
  // NewPostPage 内
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace("/auth/login?next=/posts/new");
        return;
      }
      setUid(u.id);

      // 所属グループ（必要なら）
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
    })();
  }, [router, supabase]);

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
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // state を追加
  const [hasBody, setHasBody] = useState(false);

  // 本文の実質空チェック用ハンドラを追加
  const onEditorChange = useCallback((md: string) => {
    setBody(md);
    const textish = md.replace(/[`*_#>\-\[\]\(\)!]/g, "").replace(/\s+/g, "");
    setHasBody(textish.length > 0);
  }, []);

  // ===== 投稿保存ロジック =====
  const doSubmit = async () => {
    setErr(null);
    setInfo(null);
    // uid がなければ最終確認
    let userId = uid;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      if (!userId) {
        router.replace("/auth/login?next=/posts/new");
        return;
      }
      setUid(userId);
    }

    if (visDraft === "group" && !groupId) {
      setErr("グループ限定公開を選択した場合は、グループを選んでください。");
      return;
    }
    setSaving(true);

    const finalMd =
      (await editorRef.current?.exportMarkdownWithUploads(uploadToSupabase)) ??
      body;
    const readMinutes = estimateReadMinutes(finalMd);

    // カバー画像アップロード
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
      const isPublished = visDraft !== "draft";
      const linkToken = visDraft === "link" ? randomBase64Url(20) : null;
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: userId,
          title,
          slug,
          body_md: finalMd, // ← あなたのスキーマに合わせた列名を使用
          cover_image_url: coverUrl,
          visibility: visDraft,
          link_token: linkToken,
          group_id: visDraft === "group" ? groupId : null,
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

    // タグ反映（任意）
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
    setPublishOpen(false);

    if (visDraft === "link") {
      const share = `${window.location.origin}/posts/${data!.id}?token=${
        data!.link_token
      }`;
      await navigator.clipboard.writeText(share).catch(() => {});
      router.replace(`/posts/${data!.id}?token=${data!.link_token}`);
    } else {
      router.replace(`/posts/${data!.id}`);
    }
  };

  // ===== 目次（Markdown → H1〜H3 抽出） =====
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

  const saveDraftOnly = useCallback(async () => {
    if (!uid) throw new Error("auth required");

    setErr(null);
    setSaving(true);

    const finalMd =
      (await editorRef.current?.exportMarkdownWithUploads(uploadToSupabase)) ??
      body;
    const readMinutes = estimateReadMinutes(finalMd);

    let coverUrl: string | null = null;
    if (coverFile) {
      coverUrl = await uploadToSupabase(coverFile);
    }

    let slug = slugify(title || "untitled");
    const baseInsert = async () => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: uid,
          title,
          slug,
          body_md: finalMd,
          cover_image_url: coverUrl,
          visibility: "draft",
          link_token: null,
          group_id: null,
          is_published: false,
          read_minutes: readMinutes,
          published_at: null,
        })
        .select("id, slug")
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
      setErr(error.message || "下書き保存に失敗しました。");
      throw error;
    }

    setSaving(false);
    setInfo("下書きとして保存しました。");
    return data;
  }, [uid, title, body, coverFile, uploadToSupabase]);

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

  // サイドパネルの中身（PC / Drawer 共用）
  const SidePanel = (
    <Box
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
            onClick={() => {
              if (isSmDown) setSideOpen(false);
              else setMenuExpanded(false);
            }}
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
                onClick={() => {
                  scrollToHeading(idx);
                  if (isSmDown) setSideOpen(false);
                }}
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
    </Box>
  );

  return (
    <Box
      sx={{
        position: "relative",
        // iOS下部安全域 + FAB分の余白
        pb: { xs: "calc(64px + env(safe-area-inset-bottom))", sm: 2 },
      }}
    >
      {/* ====== モバイル時：上部にツール開閉ボタン（AppBar） ====== */}
      {isSmDown && (
        <AppBar
          elevation={0}
          color="default"
          position="sticky"
          sx={{
            top: 0,
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: "background.paper",
            pt: "env(safe-area-inset-top)",
          }}
        >
          <Toolbar sx={{ minHeight: 48, gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
              新規投稿
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`読了 ${estimateReadMinutes(body)}分`}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* ====== メイングリッド（sm以下は1カラム） ====== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: `${sideW}px 1fr`,
          },
          gap: 2,
          alignItems: "start",
          transition: "grid-template-columns .2s ease",
        }}
      >
        {/* === 左サイド（PC：レール+カード / モバイル：非表示） === */}
        <Box
          sx={{
            display: { xs: "none", sm: "grid" },
            position: "sticky",
            top: 88,
            height: "calc(100dvh - 136px)",
            gridTemplateColumns: `${railW}px ${menuExpanded ? paneW : 0}px`,
            gap: 1,
            transition: "grid-template-columns .2s ease",
          }}
        >
          {/* 縦アイコンのレール（常時表示） */}
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

          {/* パネル本体 */}
          {menuExpanded && <Paper variant="outlined">{SidePanel}</Paper>}
        </Box>

        {/* === 右メイン（タイトル + エディタ） === */}
        <Box>
          {/* 操作バー（PC表示） */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 1, display: { xs: "none", sm: "flex" } }}
          >
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
              disabled={saving || !title.trim() || !hasBody}
            >
              保存 / 公開
            </Button>
          </Stack>

          {/* モバイル：上に「ツールを開く」ボタン（必要なら） */}
          {isSmDown && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TocIcon />}
                  onClick={() => {
                    setPanelMode("toc");
                    setSideOpen(true);
                  }}
                >
                  目次
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MenuBookIcon />}
                  onClick={() => {
                    setPanelMode("tpl");
                    setSideOpen(true);
                  }}
                >
                  テンプレ
                </Button>
              </Stack>
            </Box>
          )}

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
                onChangeMd={onEditorChange}
                placeholder="本文を入力"
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

      {/* 上書き警告（テンプレ挿入時） */}
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

      {/* 公開方法 + タグ + カバー画像（sm以下はフルスクリーン） */}
      <Dialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isSmDown}
        PaperProps={{
          sx: isSmDown ? { pt: "env(safe-area-inset-top)" } : undefined,
        }}
      >
        <DialogTitle>公開方法を選択</DialogTitle>
        <DialogContent
          dividers
          sx={{
            maxHeight: isSmDown ? "unset" : "70vh",
            overflow: "auto",
          }}
        >
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
              value="group"
              control={<Radio />}
              label="グループ限定公開"
            />
            <FormControlLabel
              value="link"
              control={<Radio />}
              label="リンク限定（URLを知っている人のみ）"
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
            {coverPreview ? (
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
                  src={coverPreview}
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
        <DialogActions
          sx={{
            pb: isSmDown ? "calc(8px + env(safe-area-inset-bottom))" : 2,
          }}
        >
          <Button onClick={() => setPublishOpen(false)}>戻る</Button>
          <Button
            onClick={doSubmit}
            variant="contained"
            disabled={saving || (visDraft === "group" && !groupId)}
          >
            {visDraft === "draft" ? "下書き保存" : "公開する"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== モバイル：公開FAB（親指タップ） ====== */}
      {isSmDown && (
        <Fab
          color="primary"
          onClick={() => setPublishOpen(true)}
          sx={{
            position: "fixed",
            right: 16,
            bottom: "calc(16px + env(safe-area-inset-bottom))",
            zIndex: 1200,
          }}
          aria-label="publish"
        >
          <PublishIcon />
        </Fab>
      )}

      {/* ====== モバイル：サイドDrawer（目次/テンプレ） ====== */}
      <Drawer
        anchor="left"
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        PaperProps={{
          sx: {
            width: Math.min(
              360,
              typeof window !== "undefined" ? window.innerWidth * 0.9 : 320
            ),
          },
        }}
      >
        {/* Drawerヘッダー（モード切替） */}
        <Box sx={{ display: "flex", alignItems: "center", p: 1, gap: 1 }}>
          <Button
            size="small"
            startIcon={<TocIcon />}
            variant={panelMode === "toc" ? "contained" : "outlined"}
            onClick={() => setPanelMode("toc")}
          >
            目次
          </Button>
          <Button
            size="small"
            startIcon={<MenuBookIcon />}
            variant={panelMode === "tpl" ? "contained" : "outlined"}
            onClick={() => setPanelMode("tpl")}
          >
            テンプレ
          </Button>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={() => setSideOpen(false)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Divider />
        {SidePanel}
      </Drawer>
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
