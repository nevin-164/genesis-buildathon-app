import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "internlens";

/**
 * The client is built on first use, not at import.
 *
 * Throwing at module scope broke `next build`: collecting page data evaluates
 * every route's module graph, so a machine without the storage secrets could
 * not build the app at all — including the routes that never touch storage.
 * Deferring it keeps the failure where it belongs, on the request that
 * actually needs a signed URL.
 */
let client: SupabaseClient | null = null;

function storage(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY to upload or download documents.",
    );
  }

  client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return client;
}

export async function createSignedUploadUrl(path: string): Promise<string> {
  const { data, error } = await storage().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error("Failed to sign upload url: " + error.message);
  }
  return data.signedUrl;
}

export async function createSignedDownloadUrl(path: string, expiresIn = 60): Promise<string> {
  const { data, error } = await storage().storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) {
    throw new Error("Failed to sign download url: " + error.message);
  }
  return data.signedUrl;
}

export async function deleteObject(path: string): Promise<void> {
  const { error } = await storage().storage.from(BUCKET).remove([path]);
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
  const { data, error } = await storage().storage.from(BUCKET).list(folder, {
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
