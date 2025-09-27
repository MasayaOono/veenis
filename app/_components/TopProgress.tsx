"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * URL 変化を検知して、上部プログレスバーを “それっぽく” 進行させる。
 * - 最初に 0.2→0.6 までスッと上げ、しばらくジワジワ進行
 * - 完了時に 1.0→フェードアウト
 */
export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(0);
  const timerRef = useRef<number | null>(null);
  const fadeRef = useRef<number | null>(null);
  const key = `${pathname}?${searchParams?.toString() ?? ""}`;

  useEffect(() => {
    // 遷移開始
    setActive(true);
    setScale(0.2);

    // 少し待ってから中間まで
    timerRef.current = window.setTimeout(() => setScale(0.6), 120) as any;

    // “じわ進行”
    const iv = window.setInterval(() => {
      setScale((v) => Math.min(0.9, v + Math.random() * 0.05));
    }, 300) as any;

    return () => {
      // 遷移確定（クリーンアップ側で完了アニメ）
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.clearInterval(iv);
      setScale(1);

      // 完了フェード
      fadeRef.current = window.setTimeout(() => {
        setActive(false);
        setScale(0);
      }, 200) as any;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!active) return null;

  return (
    <div className="topbar" aria-hidden>
      <div
        className="topbar__bar"
        style={{ transform: `scaleX(${scale})` }}
      >
        <div className="topbar__peg" />
      </div>
    </div>
  );
}
