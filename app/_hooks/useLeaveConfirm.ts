// app/_hooks/useLeaveConfirm.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 投稿編集など「未保存で離脱」ブロック用フック
 *
 * - beforeunload: リロード/タブ閉じ/外部遷移をブロック
 * - 内部リンククリック（同一オリジン <a>）を捕捉→ダイアログ
 * - popstate（戻る）を番兵pushStateでガード→ダイアログ
 *
 * Dialog は別コンポーネント(LeaveConfirmDialog)に渡すハンドラ/状態だけ提供します。
 */
export function useLeaveConfirm(opts: {
  /** 編集中かどうか（true の間だけガード有効） */
  isDirty: boolean;
  /** 「下書き保存して移動」押下時に呼ばれる保存処理（throw で失敗扱い） */
  onSaveDraft: () => Promise<any>;
  /** 保存可能か（例：ログイン済みなど）。false なら「下書き保存」ボタンを無効化 */
  canSave: boolean;
}) {
  const { isDirty, onSaveDraft, canSave } = opts;
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nextUrlRef = useRef<string | null>(null);
  const resolvingPopRef = useRef(false);
  const enabledRef = useRef(false);

  // === beforeunload: リロード/タブ閉じ/外部遷移 ===
  useEffect(() => {
    enabledRef.current = isDirty;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      e.returnValue = ""; // Chrome系での表示に必要
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // === 内部リンククリック捕捉（capture）===
  useEffect(() => {
    if (!isDirty) return;
    const onClick = (e: MouseEvent) => {
      if (!enabledRef.current) return;

      // 既に阻止済み/修飾キー/中クリック/右クリックは対象外
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      // ダイアログ自身の領域は除外
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-leave-dialog]")) return;

      // 祖先の <a> を探索
      let el = target;
      while (el && el.tagName !== "A")
        el = el.parentElement as HTMLElement | null;
      const a = el as HTMLAnchorElement | null;
      if (!a || !a.href) return;
      if (a.target && a.target !== "_self") return;
      if ((a as any).download) return;

      const url = new URL(a.href);
      const here = new URL(window.location.href);

      if (url.origin === here.origin) {
        e.preventDefault();
        nextUrlRef.current = url.pathname + url.search + url.hash;
        setDialogOpen(true);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty]);

  // === 戻る(popstate)をガード ===
  useEffect(() => {
    if (!isDirty) return;

    const onPop = (e: PopStateEvent) => {
      if (!enabledRef.current) return;
      if (resolvingPopRef.current) return;
      e.preventDefault?.();

      // 今のURLを即pushして「戻る」を無かったことに（番兵）
      resolvingPopRef.current = true;
      history.pushState(null, "", window.location.href);
      nextUrlRef.current = "POPSTATE::BACK";
      setDialogOpen(true);
      setTimeout(() => (resolvingPopRef.current = false), 0);
    };

    window.addEventListener("popstate", onPop);
    // ガード開始時に番兵 push
    history.pushState(null, "", window.location.href);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [isDirty]);

  const proceedLeave = useCallback(() => {
    const target = nextUrlRef.current;
    setDialogOpen(false);
    nextUrlRef.current = null;
    if (!target || target === "POPSTATE::BACK") {
      history.back();
    } else {
      router.push(target);
    }
  }, [router]);

  const confirmDiscardAndLeave = useCallback(() => {
    // 以降のガードを外す
    enabledRef.current = false;
    setDialogOpen(false);
    proceedLeave();
  }, [proceedLeave]);

  const confirmSaveAndLeave = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSaveDraft();
      // 保存成功 → ガード外して遷移
      enabledRef.current = false;
      proceedLeave();
    } catch {
      // 保存失敗 → とどまる（ダイアログは開いたままでもOK）
    } finally {
      setIsSaving(false);
    }
  }, [onSaveDraft, canSave, proceedLeave]);

  const cancelLeave = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return {
    dialogOpen,
    isSaving,
    canSave,
    // Dialog 用ハンドラ
    cancelLeave,
    confirmDiscardAndLeave,
    confirmSaveAndLeave,
  };
}

export type UseLeaveConfirmReturn = ReturnType<typeof useLeaveConfirm>;
