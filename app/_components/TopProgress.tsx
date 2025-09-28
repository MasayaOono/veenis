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

  const hasMountedOnce = useRef(false);
  const ivRef = useRef<number | null>(null);
  const t1Ref = useRef<number | null>(null);
  const tFinishRef = useRef<number | null>(null);
  const tDeadlineRef = useRef<number | null>(null);
  const onLoadRef = useRef<() => void>();

  const cleanupTimers = () => {
    if (ivRef.current) clearInterval(ivRef.current);
    if (t1Ref.current) clearTimeout(t1Ref.current);
    if (tFinishRef.current) clearTimeout(tFinishRef.current);
    if (tDeadlineRef.current) clearTimeout(tDeadlineRef.current);
    if (onLoadRef.current) {
      window.removeEventListener("load", onLoadRef.current);
      onLoadRef.current = undefined;
    }
    ivRef.current = t1Ref.current = tFinishRef.current = tDeadlineRef.current = null;
  };

  const finish = () => {
    setScale(1);
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
    t1Ref.current = window.setTimeout(() => setScale(0.6), 80) as any;
    // ちょいちょい伸びる（0.9まで）
    ivRef.current = window.setInterval(() => {
      setScale((v) => Math.min(0.9, v + Math.random() * 0.06));
    }, 250) as any;

    // フェイルセーフ（最大 8 秒）
    tDeadlineRef.current = window.setTimeout(finish, 8000) as any;

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

    // ここからクライアント遷移のみ：開始 → 「次の描画」で完了
    start();

    // 最初の描画タイミングで完了させる（二段 rAF）
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => finish());
      tFinishRef.current = r2 as any; // クリア用に保持
    });
    tFinishRef.current = r1 as any;

    // クリーンアップは「タイマーとリスナの解除だけ」
    return () => cleanupTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => () => cleanupTimers(), []);

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
          background: radial-gradient(closest-side, rgba(255,255,255,.9), transparent);
        }
      `}</style>
    </div>
  );
}
