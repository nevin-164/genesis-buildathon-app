import "server-only";

import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars. Cannot initialise Storage service.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BUCKET = "internlens";

export async function createSignedUploadUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error("Failed to sign upload url: " + error.message);
  }
  return data.signedUrl;
}

export async function createSignedDownloadUrl(path: string, expiresIn = 60): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) {
    throw new Error("Failed to sign download url: " + error.message);
  }
  return data.signedUrl;
}

export async function deleteObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error("Failed to delete object: " + error.message);
  }
}

export async function getObjectMeta(
  path: string,
): Promise<{ sizeBytes: number; mimeType: string } | null> {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return null;
  
  const folder = path.substring(0, lastSlash);
  const filename = path.substring(lastSlash + 1);

  // Storage `list` gets metadata without downloading the file
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    search: filename,
    limit: 1,
  });

  if (error || !data || data.length === 0) return null;
  
  const file = data[0];
  return {
    sizeBytes: file.metadata?.size ?? 0,
    mimeType: file.metadata?.mimetype ?? "application/octet-stream",
  };
}
