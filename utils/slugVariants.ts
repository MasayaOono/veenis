export function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
export function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

/** s の可能な全バリアント（生/NFC/NFKC/encode/decoded）を列挙 */
export function buildSlugVariants(s: string) {
  const raw = s ?? "";
  const nfc = raw.normalize("NFC");
  const nfkc = raw.normalize("NFKC");
  const dec = decodeSafe(raw);
  const decNfc = dec.normalize("NFC");
  const decNfkc = dec.normalize("NFKC");

  return uniq([
    raw,
    nfc,
    nfkc,
    encodeURIComponent(raw),
    encodeURIComponent(nfc),
    encodeURIComponent(nfkc),
    dec,
    decNfc,
    decNfkc,
    encodeURIComponent(dec),
    encodeURIComponent(decNfc),
    encodeURIComponent(decNfkc),
  ]).filter(Boolean);
}
