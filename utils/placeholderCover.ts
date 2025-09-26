// utils/placeholderCover.ts
type Opts = {
  width?: number;
  height?: number;
  brand?: {
    border?: string;
    panel?: string;
    title?: string;
    sub?: string;
    underline?: string;
    shadow?: string;
  };
};

const cache = new Map<string, string>();

export function renderPlaceholderSvg(
  title: string,
  author?: string | null,
  opts: Opts = {}
): string {
  const width = opts.width ?? 1200;
  const height = opts.height ?? 800;

  const brand = {
    border: opts.brand?.border ?? "#CC66E8",
    panel: opts.brand?.panel ?? "#FFFFFF",
    title: opts.brand?.title ?? "#555555",
    sub: opts.brand?.sub ?? "#666666",
    underline: opts.brand?.underline ?? "#45D0CF",
    shadow: opts.brand?.shadow ?? "rgba(0,0,0,0.08)",
  };

  const len = [...title].length;
  const titleSize =
    len <= 10 ? 72 : len <= 16 ? 64 : len <= 22 ? 56 : len <= 30 ? 48 : len <= 42 ? 40 : 34;

  const subSize = 32;
  const pad = 48;
  const radius = 36;
  const underlineW = Math.max(280, Math.min(560, Math.round(width * 0.46)));
  const underlineY = Math.round(height * 0.5) + Math.round(titleSize * 0.15);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="outerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="${brand.shadow}"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="${brand.border}" rx="${radius}" ry="${radius}" />

  <g filter="url(#outerShadow)">
    <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}"
      fill="${brand.panel}" rx="${radius}" ry="${radius}" />
  </g>

  <text x="${width / 2}" y="${height / 2 - 24}"
    fill="${brand.title}"
    font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
    font-size="${titleSize}" font-weight="800" text-anchor="middle" dominant-baseline="central">
    ${escapeXml(title)}
  </text>

  <rect x="${(width - underlineW) / 2}" y="${underlineY}" width="${underlineW}" height="6" rx="3" fill="${brand.underline}" />

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
}

export function getPlaceholderCoverDataUrl(
  title: string,
  author?: string | null,
  opts: Opts = {}
): string {
  const key = JSON.stringify({ title, author: author ?? "", opts });
  const hit = cache.get(key);
  if (hit) return hit;
  const svg = renderPlaceholderSvg(title, author, opts);
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
