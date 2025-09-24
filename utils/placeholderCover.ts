// utils/placeholderCover.ts
// タイトル＆著者名入りプレースホルダーを SVG で生成して dataURL で返す
type Opts = {
  width?: number; // 既定 1200
  height?: number; // 既定 800（3:2にしたいなら 1200x800 がちょうど良い）
  brand?: {
    border?: string; // 外枠のパープル
    panel?: string; // 内側パネルの白
    title?: string; // タイトル文字色
    sub?: string; // 著者名文字色
    underline?: string; // タイトル下のライン色
    shadow?: string; // 軽い外側影（任意）
  };
};

const cache = new Map<string, string>();

export function getPlaceholderCoverDataUrl(
  title: string,
  author?: string | null,
  opts: Opts = {}
): string {
  const width = opts.width ?? 1200;
  const height = opts.height ?? 800;

  const brand = {
    border: opts.brand?.border ?? "#CC66E8", // 画像の例に寄せたパープル
    panel: opts.brand?.panel ?? "#FFFFFF",
    title: opts.brand?.title ?? "#555555",
    sub: opts.brand?.sub ?? "#666666",
    underline: opts.brand?.underline ?? "#45D0CF", // シアン寄り
    shadow: opts.brand?.shadow ?? "rgba(0,0,0,0.08)",
  };

  const key = JSON.stringify({
    title,
    author: author ?? "",
    width,
    height,
    brand,
  });
  const hit = cache.get(key);
  if (hit) return hit;

  // タイトル長に応じてフォントサイズを調整（目安）
  const len = [...title].length;
  const titleSize =
    len <= 10
      ? 72
      : len <= 16
      ? 64
      : len <= 22
      ? 56
      : len <= 30
      ? 48
      : len <= 42
      ? 40
      : 34;

  const subSize = 32;

  // 余白や角丸
  const pad = 48;
  const radius = 36;

  // タイトル下のライン幅（タイトル長に合わせてほどよく）
  const underlineW = Math.max(280, Math.min(560, Math.round(width * 0.46)));
  const underlineY = Math.round(height * 0.5) + Math.round(titleSize * 0.15);

  // SVG（中央寄せ・多言語OK）
  // ※ フォントはシステムフォントにフォールバック
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="outerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="${
        brand.shadow
      }"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="${
    brand.border
  }" rx="${radius}" ry="${radius}" />

  <!-- 内側パネル（白） -->
  <g filter="url(#outerShadow)">
    <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${
    height - pad * 2
  }"
      fill="${brand.panel}" rx="${radius}" ry="${radius}" />
  </g>

  <!-- タイトル -->
  <text x="${width / 2}" y="${height / 2 - 24}"
    fill="${brand.title}"
    font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
    font-size="${titleSize}" font-weight="800" text-anchor="middle" dominant-baseline="central">
    ${escapeXml(title)}
  </text>

  <!-- タイトル下ライン -->
  <rect x="${
    (width - underlineW) / 2
  }" y="${underlineY}" width="${underlineW}" height="6" rx="3" fill="${
    brand.underline
  }" />

  <!-- サブ：著者名 -->
  ${
    author
      ? `<text x="${width / 2}" y="${height / 2 + 120}"
           fill="${brand.sub}"
           font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Helvetica Neue', Arial"
           font-size="${subSize}" font-weight="700" text-anchor="middle" dominant-baseline="central">
           ${escapeXml(author)}
         </text>`
      : ""
  }
</svg>`.trim();

  // data URL へ
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
