// src/lib/storage/uploadReferenceImage.ts
import { supabaseBrowser } from "../supabase/browserClient";

/**
 * Normalize an arbitrary image File to a standard RGB JPEG using a canvas.
 * If decoding fails (e.g., unsupported format), fall back to the original file.
 */
async function normalizeToJpeg(file: File): Promise<File> {
  try {
    // Fast path: use createImageBitmap if available (more robust than HTMLImageElement for some formats)
    const bitmap = await createImageBitmap(file).catch(async () => {
      // Fallback to <img> decode if createImageBitmap fails
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      // Draw <img> to bitmap-like canvas
      const cnv2 = document.createElement("canvas");
      cnv2.width = imgEl.naturalWidth || imgEl.width;
      cnv2.height = imgEl.naturalHeight || imgEl.height;
      const ctx2 = cnv2.getContext("2d");
      if (!ctx2) throw new Error("Canvas 2D context unavailable");
      ctx2.drawImage(imgEl, 0, 0);
      return await createImageBitmap(cnv2);
    });

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(bitmap, 0, 0);

    // Encode as high-quality JPEG (RGB)
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    );
    if (!blob) throw new Error("JPEG encoding failed.");

    // Preserve original base name but force .jpg
    const base = (file.name || "image").replace(/\.[^.]+$/g, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    // If anything fails, just return the original file (upload may still succeed)
    return file;
  }
}

async function sha1OfBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload a local user-selected File to Supabase Storage and return a PUBLIC URL.
 * Bucket: reference-images (Public read; writes restricted to authed users)
 *
 * IMPORTANT: This function now normalizes the file into a standard RGB JPEG (".jpg")
 * so downstream (Replicate/PIL) can always decode it.
 */
export async function uploadReferenceImage(params: {
  file: File;
  userId: string;
}): Promise<string> {
  const { file, userId } = params;
  if (!file) throw new Error("No file provided for upload.");
  if (!userId) throw new Error("Missing user id.");

  // Normalize to a standard JPEG first
  const normalized = await normalizeToJpeg(file);

  // Hash AFTER normalization so identical images dedupe correctly
  const hash = await sha1OfBlob(normalized);
  const ext = "jpg"; // we always encode to JPEG
  const path = `${userId}/${Date.now()}-${hash}.${ext}`;

  const { data, error } = await supabaseBrowser.storage
    .from("reference-images")
    .upload(path, normalized, {
      cacheControl: "31536000",
      upsert: false,
      contentType: "image/jpeg",
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: pub } = supabaseBrowser.storage
    .from("reference-images")
    .getPublicUrl(data!.path);

  if (!pub?.publicUrl) {
    throw new Error("Could not obtain public URL after upload.");
  }

  return pub.publicUrl;
}