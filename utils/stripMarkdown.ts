// src/utils/stripMarkdown.ts
export function stripMarkdown(md: string): string {
  if (!md) return "";
  let s = md;

  // 1) コードフェンス ```...``` / ~~~...~~~
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/~~~[\s\S]*?~~~/g, " ");

  // 2) インラインコード `code`
  s = s.replace(/`[^`]*`/g, " ");

  // 3) 画像 ![alt](url) -> alt
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1 ");

  // 4) リンク [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 5) 強調 **text** / *text* / _text_ / ~~text~~
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/_([^_]+)_/g, "$1");
  s = s.replace(/~~([^~]+)~~/g, "$1");

  // 6) 見出し記号（行頭だけでなく文中に出てきた " ## " も消す）
  s = s.replace(/(^|\s)#{1,6}\s+/g, "$1");

  // 7) 引用記号（> ）も行頭/文中どちらでも
  s = s.replace(/(^|\s)>\s+/g, "$1");

  // 8) リスト記号（- * + / 数字. ）を行頭/文中どちらでも
  //    例: " 1. text" や " - text" を除去（数字は最大3桁に限定）
  s = s.replace(/(^|\s)(?:[-*+]\s+|\d{1,3}\.\s+)/g, "$1");

  // 9) HTMLタグ除去（万一混入時）
  s = s.replace(/<[^>]+>/g, " ");

  // 10) 改行→空白、空白畳み込み
  s = s.replace(/[\r\n]+/g, " ");
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}

export function ellipsis(s: string, max = 160): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+$/, "") + "…";
}
