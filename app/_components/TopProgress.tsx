// app/_components/TopProgress.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams?.toString() ?? ""}`;

  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(0);

  const hasMountedOnce = useRef<boolean>(false);

  // timers / raf
  const ivRef = useRef<number | null>(null);
  const t1Ref = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const raf1Ref = useRef<number | null>(null);
  const raf2Ref = useRef<number | null>(null);

  // load listener
  const onLoadRef = useRef<(() => void) | null>(null);

  const cleanupTimers = () => {
    if (ivRef.current != null) {
      clearInterval(ivRef.current);
      ivRef.current = null;
    }
    if (t1Ref.current != null) {
      clearTimeout(t1Ref.current);
      t1Ref.current = null;
    }
    if (deadlineRef.current != null) {
      clearTimeout(deadlineRef.current);
      deadlineRef.current = null;
    }
    if (raf1Ref.current != null) {
      cancelAnimationFrame(raf1Ref.current);
      raf1Ref.current = null;
    }
    if (raf2Ref.current != null) {
      cancelAnimationFrame(raf2Ref.current);
      raf2Ref.current = null;
    }
    if (onLoadRef.current) {
      window.removeEventListener("load", onLoadRef.current);
      onLoadRef.current = null;
    }
  };

  const finish = () => {
    setScale(1);
    // 少し待ってから消す
    window.setTimeout(() => {
      setActive(false);
      setScale(0);
      cleanupTimers();
    }, 180);
  };

  const start = () => {
    cleanupTimers();
    setActive(true);
    setScale(0.2);

    // スッと伸びる
    t1Ref.current = window.setTimeout(() => setScale(0.6), 80) as unknown as number;

    // ちょいちょい伸びる（0.9 まで）
    ivRef.current = window.setInterval(() => {
      setScale((v) => Math.min(0.9, v + Math.random() * 0.06));
    }, 250) as unknown as number;

    // フェイルセーフ（最大 8 秒）
    deadlineRef.current = window.setTimeout(finish, 8000) as unknown as number;

    // ページロード完了でも終わる（リロード系の保険）
    const onLoad = () => finish();
    onLoadRef.current = onLoad;
    window.addEventListener("load", onLoad, { once: true });
  };

  useEffect(() => {
    // 初回ロードではバーを出さない（App Router の loading.tsx に任せる）
    if (!hasMountedOnce.current) {
      hasMountedOnce.current = true;
      return;
    }

    // クライアント遷移: 開始 → 次の描画で完了
    start();

    // 二段 rAF で「描画が起きたら」確実に閉じる
    raf1Ref.current = requestAnimationFrame(() => {
      raf2Ref.current = requestAnimationFrame(() => finish());
    });

    // アンマウント/キー変更時の掃除
    return () => cleanupTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // コンポーネント完全破棄時も掃除
    return () => cleanupTimers();
  }, []);

  if (!active) return null;

  return (
    <div className="topbar" aria-hidden>
      <div className="topbar__bar" style={{ transform: `scaleX(${scale})` }}>
        <div className="topbar__peg" />
      </div>
      <style jsx>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 2000;
          pointer-events: none;
        }
        .topbar__bar {
          height: 3px;
          transform-origin: 0 0;
          background: linear-gradient(90deg, #7c3aed, #06b6d4);
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.4);
          transition: transform 120ms ease;
        }
        .topbar__peg {
          position: absolute;
          right: 0;
          width: 80px;
          height: 100%;
          opacity: 0.7;
          filter: blur(4px);
          background: radial-gradient(closest-side, rgba(255, 255, 255, 0.9), transparent);
        }
      `}</style>
    </div>
  );
}
