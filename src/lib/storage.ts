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

/**
 * Качва снимка на личен документ (лична карта и др.) за страна по договор.
 * Bucket-ът "contract-documents" е ПРИВАТЕН — само брокерът вижда собствените си файлове.
 * Phase 1: само съхранение, без OCR разпознаване на данни от снимката.
 */
export async function uploadContractIdPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("contract-documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  // Кратък срок на валидност — лични документи не трябва да имат дълготрайни публични линкове
  const { data, error: signErr } = await supabase.storage
    .from("contract-documents").createSignedUrl(path, 60 * 60 * 24 * 7); // 7 дни
  if (signErr) throw signErr;
  return data.signedUrl;
}

export const MAX_DOC_BYTES = 10 * 1024 * 1024;

export function validateDocFile(file: File): string | null {
  const okType = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!okType) return "Моля, изберете снимка (JPG/PNG) или PDF файл.";
  if (file.size > MAX_DOC_BYTES) return "Файлът е твърде голям. Максимален размер: 10 MB.";
  return null;
}

/**
 * Качва документ за REMI Правен анализ (скица, схема, тежести, данъчна оценка,
 * документ за собственост) в приватния bucket "legal-documents".
 */
export async function uploadLegalDocument(userId: string, file: File): Promise<{ path: string; signedUrl: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("legal-documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("legal-documents").createSignedUrl(path, 60 * 60 * 24 * 30); // 30 дни
  if (signErr) throw signErr;
  return { path, signedUrl: data.signedUrl };
}

/**
 * Качва снимка на документ за самоличност в приватния bucket "identity-documents".
 * Опционално — основният начин на въвеждане на самоличност е ръчен/OCR без задължителна снимка.
 */
export async function uploadIdentityDocument(userId: string, file: File): Promise<{ path: string; signedUrl: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("identity-documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("identity-documents").createSignedUrl(path, 60 * 60 * 24 * 7); // 7 дни
  if (signErr) throw signErr;
  return { path, signedUrl: data.signedUrl };
}
