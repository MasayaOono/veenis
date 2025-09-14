// lib/upload.ts
import { createClient } from './supabase';
import { compressImage } from './image';

export const uploadImage = async (file: File, userId: string) => {
  const sb = createClient();
  const compressed = await compressImage(file, { maxSize: 1600, quality: 0.8 });

  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const base = `users/${userId}/${yyyy}/${mm}`;
  const filename = `${crypto.randomUUID()}.webp`;
  const path = `${base}/${filename}`;

  const { error } = await sb.storage
    .from('public-images')
    .upload(path, compressed, {
      contentType: 'image/webp',
      cacheControl: '604800', // 秒（=7日）：CDNに長く置いて帯域節約
      upsert: false
    });

  if (error) throw error;

  const { data } = sb.storage.from('public-images').getPublicUrl(path);
  return data.publicUrl; // 例: https://xxx.supabase.co/storage/v1/object/public/public-images/...
};
