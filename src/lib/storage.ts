import { supabase } from "@/integrations/supabase/client";

const YEAR = 60 * 60 * 24 * 365;

export async function uploadListingPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listing-photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("listing-photos").createSignedUrl(path, YEAR);
  if (signErr) throw signErr;
  return data.signedUrl;
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Моля, изберете файл със снимка (JPG, PNG, WEBP).";
  if (file.size > MAX_PHOTO_BYTES) return "Файлът е твърде голям. Максимален размер: 5 MB.";
  return null;
}

export async function uploadBrokerPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("broker-photos").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("broker-photos").createSignedUrl(path, YEAR);
  if (signErr) throw signErr;
  return data.signedUrl;
}
