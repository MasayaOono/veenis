// app/_components/RichEditor.tsx
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
import { TextSelection } from "@tiptap/pm/state";

import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Paper,
  useMediaQuery,
} from "@mui/material";
import TitleIcon from "@mui/icons-material/Title";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

export type RichEditorHandle = {
  exportMarkdownWithUploads: (
    uploadFn: (file: File) => Promise<string>
  ) => Promise<string>;
  hasPendingUploads: () => boolean;
  focusHeading: (text: string, level?: 1 | 2 | 3) => void;
};

type Props = {
  valueMd: string;
  onChangeMd: (md: string) => void;
  placeholder?: string;
};

const TOOLBAR_W = 52;
const TOOLBAR_OFFSET_X = 16;

const RichEditor = forwardRef<RichEditorHandle, Props>(function Inner(
  { valueMd, onChangeMd, placeholder },
  ref
) {
  const isMdDown = useMediaQuery("(max-width:900px)"); // タブレット含む
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const toolRef = useRef<HTMLDivElement | null>(null);
  const [toolbarY, setToolbarY] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [pendingMap, setPendingMap] = useState<Map<string, File>>(new Map());
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 初期HTML（Markdown→HTML）
  const initialHTML = useMemo(
    () => (valueMd ? (marked.parse(valueMd) as string) : ""),
    [valueMd]
  );

  const requestPositionUpdate = () => {
    if (!editor || !wrapperRef.current) return;
    const { view, state } = editor;
    const from = state.selection.from;
    const caret = view.coordsAtPos(from);
    const wrapRect = wrapperRef.current.getBoundingClientRect();
    const toolH = toolRef.current?.offsetHeight ?? 0;

    let y = caret.top - wrapRect.top - toolH / 2;
    const padding = 8;
    const minY = 0 + padding;
    const maxY = (wrapRect.height || 0) - toolH - padding;
    y = Math.max(minY, Math.min(maxY, y));
    setToolbarY(y);
  };

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
        emptyEditorClass: "is-editor-empty",
        showOnlyCurrent: false,
        includeChildren: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: "article-body tiptap-content",
      },
      handleDrop(_view, event) {
        const files = Array.from(event.dataTransfer?.files || []);
        const imgs = files.filter((f) => f.type.startsWith("image/"));
        if (imgs.length) {
          event.preventDefault();
          imgs.forEach(addFile);
          return true;
        }
        return false;
      },
      handlePaste(_view, event) {
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
    onSelectionUpdate: requestPositionUpdate,
    onTransaction: requestPositionUpdate,
    onCreate: requestPositionUpdate,
    immediatelyRender: false,
  });

  // 外部 valueMd 変更を TipTap に同期
  useEffect(() => {
    if (!editor) return;
    const currentMd = turndown.turndown(editor.getHTML());
    if (currentMd !== valueMd) {
      editor.commands.setContent(
        valueMd ? (marked.parse(valueMd) as string) : "",
        { emitUpdate: false }
      );
      requestPositionUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMd]);

  // スクロール/リサイズ時も位置更新
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(requestPositionUpdate);
    };
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(requestPositionUpdate);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
          setPendingMap(new Map());
          return md;
        } finally {
          setUploading(false);
        }
      },
      hasPendingUploads() {
        return pendingMap.size > 0;
      },
      focusHeading(text, level) {
        if (!editor) return;
        const { state, view } = editor;
        const headingType = editor.schema.nodes.heading;
        let foundPos: number | null = null;

        state.doc.descendants((node, pos) => {
          if (node.type === headingType) {
            const lv = (node.attrs.level ?? 1) as 1 | 2 | 3;
            const plain = node.textContent || "";
            if ((!level || lv === level) && plain.trim() === text.trim()) {
              foundPos = pos + 1;
              return false;
            }
          }
          return true;
        });

        if (foundPos != null) {
          const tr = state.tr.setSelection(
            TextSelection.create(state.doc, foundPos)
          );
          view.dispatch(tr);
          view.focus();
          requestPositionUpdate();
        }
      },
    }),
    [editor, pendingMap, valueMd]
  );

  if (!editor) return null;

  const showTools = hovered || focused;

  return (
    <Box
      ref={wrapperRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: "relative",
        px: { xs: 0, sm: 1 },
        // ← 以前の“下部固定ツールバー”は廃止したので余白不要
      }}
      onLoad={requestPositionUpdate}
    >
      {/* PC：左のフローティングツール（従来どおり） */}
      {!isMdDown && (
        <Box
          ref={toolRef}
          sx={{
            position: "absolute",
            left: `-${TOOLBAR_W + TOOLBAR_OFFSET_X}px`,
            top: `${Math.max(0, toolbarY)}px`,
            pointerEvents: showTools ? "auto" : "none",
            opacity: showTools ? 1 : 0,
            transition: "opacity .12s linear",
          }}
        >
          <EditorToolPanel
            uploading={uploading}
            isActive={isActive}
            toggleHeading={toggleHeading}
            toggleBlockquote={toggleBlockquote}
            toggleBulletList={toggleBulletList}
            toggleOrderedList={toggleOrderedList}
            setLink={setLink}
            addFileByPicker={() => fileInputRef.current?.click()}
          />
        </Box>
      )}

      {/* モバイル/タブレット：右側のフローティング縦ツール（キャレット追従） */}
      {isMdDown && (
        <Box
          ref={toolRef}
          sx={{
            position: "absolute",
            right: 6, // 画面内に収める
            top: `${Math.max(0, toolbarY)}px`,
            zIndex: 5,
            pointerEvents: showTools ? "auto" : "none",
            opacity: showTools ? 1 : 0,
            transition: "opacity .12s linear",
          }}
        >
          <EditorToolPanel
            uploading={uploading}
            isActive={isActive}
            toggleHeading={toggleHeading}
            toggleBlockquote={toggleBlockquote}
            toggleBulletList={toggleBulletList}
            toggleOrderedList={toggleOrderedList}
            setLink={setLink}
            addFileByPicker={() => fileInputRef.current?.click()}
            dense // ← モバイルはやや大きめタップ領域に
          />
        </Box>
      )}

      {/* 隠しファイル入力（共通） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) addFile(f);
          e.currentTarget.value = "";
        }}
      />

      {/* 本体（Placeholderの見た目CSSをここに付与） */}
      <Box
        onFocusCapture={() => {
          setFocused(true);
          requestPositionUpdate();
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setFocused(false);
          }
        }}
        sx={{
          mt: 0.5,
          "& .ProseMirror": {
            outline: "none",
            border: "none",
            boxShadow: "none",
            fontSize: "1rem",
            lineHeight: 1.9,
            minHeight: 240,
          },
          "& .ProseMirror img": { maxWidth: "100%", height: "auto" },

          // ★ TipTap Placeholder 表示：is-editor-empty に ::before で描画
          "& .ProseMirror p.is-editor-empty:first-of-type::before": {
            content: 'attr(data-placeholder)',
            color: "text.secondary",
            float: "left",
            height: 0,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            opacity: 0.6,
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
});

export default RichEditor;

/* ===== ツールパネル（PC/モバイル共用、見た目だけ差分） ===== */
function EditorToolPanel({
  uploading,
  isActive,
  toggleHeading,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  setLink,
  addFileByPicker,
  dense = false,
}: {
  uploading: boolean;
  isActive: (name: string, attrs?: any) => boolean;
  toggleHeading: (l: 1 | 2 | 3) => void;
  toggleBlockquote: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  setLink: () => void;
  addFileByPicker: () => void;
  dense?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: TOOLBAR_W + (dense ? 6 : 0),
        p: 0.5,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(1.05) blur(8px)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={0.25} alignItems="center">
        <Tooltip title="見出し H1" placement="right">
          <IconButton
            size="small"
            onClick={() => toggleHeading(1)}
            color={isActive("heading", { level: 1 }) ? "primary" : "default"}
          >
            <TitleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="見出し H2" placement="right">
          <IconButton
            size="small"
            onClick={() => toggleHeading(2)}
            color={isActive("heading", { level: 2 }) ? "primary" : "default"}
          >
            <TitleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="見出し H3" placement="right">
          <IconButton
            size="small"
            onClick={() => toggleHeading(3)}
            color={isActive("heading", { level: 3 }) ? "primary" : "default"}
          >
            <TitleIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider flexItem sx={{ my: 0.5 }} />

        <Tooltip title="引用" placement="right">
          <IconButton
            size="small"
            onClick={toggleBlockquote}
            color={isActive("blockquote") ? "primary" : "default"}
          >
            <FormatQuoteIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="リンク" placement="right">
          <IconButton size="small" onClick={setLink}>
            <LinkIcon />
          </IconButton>
        </Tooltip>

        <Divider flexItem sx={{ my: 0.5 }} />

        <Tooltip title="箇条書き" placement="right">
          <IconButton
            size="small"
            onClick={toggleBulletList}
            color={isActive("bulletList") ? "primary" : "default"}
          >
            <FormatListBulletedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="番号リスト" placement="right">
          <IconButton
            size="small"
            onClick={toggleOrderedList}
            color={isActive("orderedList") ? "primary" : "default"}
          >
            <FormatListNumberedIcon />
          </IconButton>
        </Tooltip>

        <Divider flexItem sx={{ my: 0.5 }} />

        <Tooltip title="画像アップロード" placement="right">
          <span>
            <IconButton size="small" onClick={addFileByPicker} disabled={uploading}>
              {uploading ? <CircularProgress size={18} /> : <ImageIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
