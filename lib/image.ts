// lib/image.ts
export type CompressOptions = {
  maxSize?: number;    // 長辺px
  quality?: number;    // 0..1
};

export const compressImage = async (file: File, opts: CompressOptions = {}) => {
  const { maxSize = 1600, quality = 0.8 } = opts;

  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/webp', quality)
  );

  return new File([blob], replaceExt(file.name, 'webp'), { type: 'image/webp' });
};

const replaceExt = (name: string, ext: string) =>
  name.replace(/\.[^.]+$/, `.${ext}`);
