import { supabaseBrowser } from "@/lib/supabase/browserClient";

export async function uploadReferenceImage({ 
  file, 
  userId 
}: { 
  file: File; 
  userId: string; 
}): Promise<string> {
  if (!file) {
    throw new Error("File is required");
  }
  
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Compute SHA-1 hash of the file
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Determine extension from MIME type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
  };
  
  const extension = mimeToExt[file.type] || 'bin';
  const fileName = `${Date.now()}-${sha1}.${extension}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase storage
  const { data, error } = await supabaseBrowser.storage
    .from('reference-images')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (!data?.path) {
    throw new Error("Upload succeeded but no path returned");
  }

  // Get public URL
  const { data: publicData } = supabaseBrowser.storage
    .from('reference-images')
    .getPublicUrl(data.path);

  if (!publicData?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded image");
  }

  return publicData.publicUrl;
}
