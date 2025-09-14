// 3:2(1200x800)。中央に大きなタイトル（最大2行・自動改行/自動縮小）
// タイトルの右側に極小アイコンを“寄せて”配置（推定幅で位置決め）
// API消費ゼロ（SVG Data URL）

const PALETTE: Array<[number, number, number]> = [
  [210, 70, 56],
  [265, 65, 58],
  [340, 70, 60],
  [15, 75, 58],
  [190, 65, 50],
  [120, 55, 50],
];

function hash32(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function hsl(h: number, s: number, l: number) {
  return `hsl(${h} ${s}% ${l}%)`;
}
function escapeXML(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// “自然な区切り”を優先して折り返し
function wrapToLines(src: string, maxPerLine: number, maxLines: number) {
  const lines: string[] = [];
  let s = src.trim();
  const sepRegex = /[ 　、。，．・\-–—_:;|/\\]/;
  while (s.length && lines.length < maxLines) {
    if (s.length <= maxPerLine) {
      lines.push(s);
      break;
    }
    let cut = -1;
    for (let i = Math.min(maxPerLine, s.length - 1); i >= 0; i--) {
      if (sepRegex.test(s[i])) {
        cut = i;
        break;
      }
    }
    if (cut < Math.floor(maxPerLine * 0.6)) cut = maxPerLine;
    const head = s.slice(0, cut).trim();
    if (head) lines.push(head);
    s = s.slice(cut).trim();
  }
  if (s && lines.length >= maxLines) {
    const last = lines[lines.length - 1];
    const room = Math.max(0, maxPerLine - 1);
    lines[lines.length - 1] = (last.slice(0, room) + "…").trim();
  }
  return lines;
}

export function getPlaceholderCoverDataUrl(title: string, seedKey?: string) {
  const seed = hash32((seedKey ?? "") + "|" + title);
  const [h1, s1, l1] = pick(PALETTE, seed);
  const [h2, s2, l2] = pick(PALETTE, seed >>> 3);
  const [hBg, sBg, lBg] = pick(PALETTE, seed >>> 7);

  // キャンバス（3:2）
  const W = 1200,
    H = 800;
  const centerX = W / 2;

  // 背景は控えめに
  const r = 140;
  const cx1 = 480 + (seed % 60) - 30;
  const cy1 = 460 + ((seed >>> 5) % 40) - 20;
  const cx2 = cx1 + 150;
  const cy2 = cy1 - 36;

  // タイトル領域
  const sidePad = 56;
  const maxWidthPx = W - sidePad * 2; // 真ん中配置なので左右均等
  const maxLines = 2;

  // しっかり大きく（必要時だけ縮小）
  let fontSize = 70; // ベース大きめ
  const minFont = 34; // これ未満にはしない
  const charWidthFactor = 0.88; // 和文近似

  // 自動改行＋自動縮小
  let lines: string[] = [];
  for (let fs = fontSize; fs >= minFont; fs -= 2) {
    const maxPerLine = Math.max(
      8,
      Math.floor(maxWidthPx / (fs * charWidthFactor))
    );
    const wrapped = wrapToLines(title, maxPerLine, maxLines);
    const longest = wrapped.reduce(
      (a, b) => (a.length >= b.length ? a : b),
      ""
    );
    // 推定の行幅が領域を超えないか確認
    const estWidth = longest.length * fs * charWidthFactor;
    if (estWidth <= maxWidthPx) {
      fontSize = fs;
      lines = wrapped;
      break;
    }
    // ループ最後で収まらない場合も lines を更新
    lines = wrapped;
  }
  lines = lines.slice(0, maxLines);

  // 縦位置：中央付近
  const lineHeight = Math.round(fontSize * 1.16);
  const blockHeight = lineHeight * (lines.length - 1);
  const firstLineY = Math.round(H / 2 - blockHeight / 2); // ブロックを中央寄せ

  // タイトル右の極小アイコン位置を“推定行幅”から計算
  const longest = lines.reduce((a, b) => (a.length >= b.length ? a : b), "");
  const estLongestWidth = Math.min(
    maxWidthPx,
    Math.round(longest.length * fontSize * charWidthFactor)
  );
  const gap = 12; // タイトル右端からの余白
  const iconBaseY =
    firstLineY + (lines.length === 1 ? Math.round(fontSize * -0.2) : 0); // 1行のとき少し上に
  const iconX = Math.min(
    W - sidePad - 8,
    Math.round(centerX + estLongestWidth / 2 + gap)
  );

  // 極小 ve(n)n-ish アイコン
  const iconR1 = 6,
    iconR2 = 4,
    iconR3 = 3;

  const escLines = lines.map(escapeXML);
  const titleText = escLines
    .map(
      (line, i) =>
        `<tspan x="${centerX}" y="${
          firstLineY + i * lineHeight
        }">${line}</tspan>`
    )
    .join("");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="${hsl(hBg, sBg, Math.min(96, lBg + 44))}"/>
      <stop offset="100%" stop-color="${hsl(
        hBg,
        Math.max(35, sBg - 20),
        Math.max(94, lBg + 42)
      )}"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg${seed})"/>

  <!-- 背景の円（薄め） -->
  <circle cx="${cx1}" cy="${cy1}" r="${r}" fill="${hsl(
    h1,
    s1,
    l1
  )}" fill-opacity="0.18"/>
  <circle cx="${cx2}" cy="${cy2}" r="${r}" fill="${hsl(
    h2,
    s2,
    l2
  )}" fill-opacity="0.18"/>
  <circle cx="${(cx1 + cx2) / 2}" cy="${(cy1 + cy2) / 2}" r="${Math.round(
    r * 0.62
  )}"
          fill="${hsl(hBg, sBg, Math.max(40, lBg - 6))}" fill-opacity="0.10"/>

  <!-- タイトル（中央寄せ） -->
  <g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif"
     fill="hsl(210 15% 12%)" text-anchor="middle">
    <text font-size="${fontSize}" font-weight="800">${titleText}</text>
  </g>

  <!-- タイトル右側の極小アイコン -->
  <g transform="translate(${iconX}, ${iconBaseY})">
    <circle cx="0"  cy="0"   r="${iconR1}" fill="${hsl(
    h1,
    s1,
    Math.min(70, l1 + 10)
  )}" fill-opacity="0.9"/>
    <circle cx="10" cy="-5"  r="${iconR2}" fill="${hsl(
    h2,
    s2,
    Math.min(72, l2 + 12)
  )}" fill-opacity="0.85"/>
    <circle cx="7"  cy="7"   r="${iconR3}" fill="${hsl(
    hBg,
    sBg,
    Math.min(68, lBg + 8)
  )}"  fill-opacity="0.8"/>
  </g>
</svg>`.trim();

  const encoded = encodeURIComponent(svg).replace(/%20/g, " ");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
