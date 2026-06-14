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
