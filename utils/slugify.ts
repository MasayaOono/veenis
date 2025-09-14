// UnicodeをNFKCに正規化して全角→半角へ統一し、記号除去・ハイフン整形。
export function slugify(input: string): string {
  // ★NFKC：全角数字/英字などを半角へ
  const s = (input || "").normalize("NFKC").trim();
  if (!s) return "post-" + Math.random().toString(36).slice(2, 8);

  let out = s.replace(/[\s\u3000]+/g, "-"); // スペース→-
  out = out.replace(/[^\p{L}\p{N}-]+/gu, ""); // 文字/数字/ハイフン以外を除去
  out = out.replace(/-+/g, "-"); // 連続ハイフン圧縮
  out = out.replace(/^-+|-+$/g, ""); // 端のハイフン削除
  out = out.toLowerCase(); // ラテンは小文字化（和文影響なし）

  return out || "post-" + Math.random().toString(36).slice(2, 8);
}
