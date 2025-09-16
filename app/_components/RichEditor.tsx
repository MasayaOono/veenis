"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
} from "@mui/material";
import TitleIcon from "@mui/icons-material/Title";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import PreviewIcon from "@mui/icons-material/Preview";
import SplitscreenIcon from "@mui/icons-material/Splitscreen";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import TurndownService from "turndown";
import { marked } from "marked";

/* ===== 見出しID生成（詳細画面と一致させる） ===== */
const toId = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\-ぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠]/g, " ")
    .trim()
    .replace(/\s+/g, "-");

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

export type RichEditorHandle = {
  /** 画像は保存時のみアップロードし、URL置換済みMarkdownを返す */
  exportMarkdownWithUploads: (
    uploadFn: (file: File) => Promise<string>
  ) => Promise<string>;
  hasPendingUploads: () => boolean;
};

type Props = {
  valueMd: string; // 外部はMarkdownで受け渡し
  onChangeMd: (md: string) => void;
  placeholder?: string;
};

const RichEditor = forwardRef<RichEditorHandle, Props>(function Inner(
  { valueMd, onChangeMd, placeholder },
  ref
) {
  const [uploading, setUploading] = useState(false);
  const [pendingMap, setPendingMap] = useState<Map<string, File>>(new Map());
  const [showPreview, setShowPreview] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 初期内容：Markdown → HTML
  const initialHTML = useMemo(
    () => (valueMd ? (marked.parse(valueMd) as string) : ""),
    [valueMd]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({ autolink: true, openOnClick: true, linkOnPaste: true }),
      Image,
      Placeholder.configure({
        placeholder:
          placeholder ??
          "ここに本文を書いてください（見出し・引用・リスト・画像・リンク対応）",
      }),
    ],
    editorProps: {
      attributes: { class: "article-body tiptap-content" }, // 表示と同じ見た目
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []);
        const imgs = files.filter((f) => f.type.startsWith("image/"));
        if (imgs.length) {
          event.preventDefault();
          imgs.forEach(addFile);
          return true;
        }
        return false;
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const files = items
          .map((i) => i.getAsFile())
          .filter((f): f is File => !!f && f.type.startsWith("image/"));
        if (files.length) {
          event.preventDefault();
          files.forEach(addFile);
          return true;
        }
        return false;
      },
    },
    content: initialHTML,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const md = turndown.turndown(html);
      onChangeMd(md);
    },
    immediatelyRender: false, // SSRの水和ずれ回避
  });

  // 外側のMDが変わったら同期（編集ページ初期化など）
  useEffect(() => {
    if (!editor) return;
    const currentMd = turndown.turndown(editor.getHTML());
    if (currentMd !== valueMd) {
      editor.commands.setContent(
        valueMd ? (marked.parse(valueMd) as string) : "",
        { emitUpdate: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMd]);

  // 画像ファイルを一時URLで挿入（API消費ゼロ）
  const addFile = (file: File) => {
    if (!editor) return;
    const tmp = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: tmp }).run();
    setPendingMap((prev) => {
      const next = new Map(prev);
      next.set(tmp, file);
      return next;
    });
  };

  // ツールバー
  const isActive = (name: string, attrs?: any) =>
    editor?.isActive(name as any, attrs) ?? false;
  const toggleHeading = (level: 1 | 2 | 3) =>
    editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBlockquote = () =>
    editor?.chain().focus().toggleBlockquote().run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  const setLink = async () => {
    const prev = editor?.getAttributes("link")?.href as string | undefined;
    const url = window.prompt(
      "リンクURLを入力（空で解除）",
      prev || "https://"
    );
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };
  const insertImageByUrl = async () => {
    const url = window.prompt("画像URLを入力（https://...）");
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  };

  // 保存時のみアップロード → URL置換 → MD返却
  useImperativeHandle(
    ref,
    () => ({
      async exportMarkdownWithUploads(uploadFn) {
        if (!editor) return valueMd || "";
        setUploading(true);
        try {
          let html = editor.getHTML();
          for (const [tmpUrl, file] of Array.from(pendingMap.entries())) {
            const publicUrl = await uploadFn(file);
            const esc = tmpUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            html = html.replace(new RegExp(esc, "g"), publicUrl);
          }
          const md = turndown.turndown(html);
          setPendingMap(new Map()); // 成功でクリア
          return md;
        } finally {
          setUploading(false);
        }
      },
      hasPendingUploads() {
        return pendingMap.size > 0;
      },
    }),
    [editor, pendingMap, valueMd]
  );

  if (!editor) return null;

  return (
    <Box>
      {/* ツールバー */}
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
        <Tooltip title="見出し H1">
          <IconButton
            size="small"
            onClick={() => toggleHeading(1)}
            color={isActive("heading", { level: 1 }) ? "primary" : "default"}
          >
            <TitleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="見出し H2">
          <IconButton
            size="small"
            onClick={() => toggleHeading(2)}
            color={isActive("heading", { level: 2 }) ? "primary" : "default"}
          >
            <TitleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="見出し H3">
          <IconButton
            size="small"
            onClick={() => toggleHeading(3)}
            color={isActive("heading", { level: 3 }) ? "primary" : "default"}
          >
            <TitleIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        <Tooltip title="引用">
          <IconButton
            size="small"
            onClick={toggleBlockquote}
            color={isActive("blockquote") ? "primary" : "default"}
          >
            <FormatQuoteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="リンク">
          <IconButton size="small" onClick={setLink}>
            <LinkIcon />
          </IconButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        <Tooltip title="箇条書き">
          <IconButton
            size="small"
            onClick={toggleBulletList}
            color={isActive("bulletList") ? "primary" : "default"}
          >
            <FormatListBulletedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="番号リスト">
          <IconButton
            size="small"
            onClick={toggleOrderedList}
            color={isActive("orderedList") ? "primary" : "default"}
          >
            <FormatListNumberedIcon />
          </IconButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        <Tooltip title="画像（URL挿入）">
          <IconButton size="small" onClick={insertImageByUrl}>
            <ImageIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="画像（選択→保存時にアップロード）">
          <span>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={18} /> : <ImageIcon />}
            </IconButton>
          </span>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addFile(f);
            e.currentTarget.value = "";
          }}
        />

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        <Tooltip title={showPreview ? "プレビューを隠す" : "プレビューを表示"}>
          <IconButton size="small" onClick={() => setShowPreview((v) => !v)}>
            <PreviewIcon />
          </IconButton>
        </Tooltip>
        {showPreview && (
          <Tooltip title={splitView ? "単独表示に切替" : "左右分割に切替"}>
            <IconButton size="small" onClick={() => setSplitView((v) => !v)}>
              <SplitscreenIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* 本体：エディタ / 分割プレビュー / プレビュー単独 */}
      {!showPreview ? (
        <Box
          sx={{
            mt: 1.5,
            border: "1px solid rgba(0,0,0,.12)",
            borderRadius: 4,
            p: 2,
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      ) : splitView ? (
        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <Box
            sx={{
              border: "1px solid rgba(0,0,0,.12)",
              borderRadius: 4,
              p: 2,
              minHeight: 240,
            }}
          >
            <EditorContent editor={editor} />
          </Box>
          <Box
            className="article-body"
            sx={{
              border: "1px solid rgba(0,0,0,.12)",
              borderRadius: 4,
              p: 2,
              minHeight: 240,
              overflowX: "auto",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                h1({ node, ...props }) {
                  return <h1 id={toId(String(props.children))} {...props} />;
                },
                h2({ node, ...props }) {
                  return <h2 id={toId(String(props.children))} {...props} />;
                },
                h3({ node, ...props }) {
                  return <h3 id={toId(String(props.children))} {...props} />;
                },
              }}
            >
              {valueMd}
            </ReactMarkdown>
          </Box>
        </Box>
      ) : (
        <Box
          className="article-body"
          sx={{
            mt: 1.5,
            border: "1px solid rgba(0,0,0,.12)",
            borderRadius: 4,
            p: 2,
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              h1({ node, ...props }) {
                return <h1 id={toId(String(props.children))} {...props} />;
              },
              h2({ node, ...props }) {
                return <h2 id={toId(String(props.children))} {...props} />;
              },
              h3({ node, ...props }) {
                return <h3 id={toId(String(props.children))} {...props} />;
              },
            }}
          >
            {valueMd}
          </ReactMarkdown>
        </Box>
      )}
    </Box>
  );
});

export default RichEditor;
