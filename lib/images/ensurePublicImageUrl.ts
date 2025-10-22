import { isPublicHttpUrl } from "@/lib/url/isPublicHttpUrl";
import { uploadReferenceImage } from "@/lib/storage/uploadReferenceImage";

export async function ensurePublicImageUrl(opts: {
  rawUrl?: string | null;
  file?: File | null;
  userId: string;
}): Promise<string> {
  const { rawUrl, file, userId } = opts;

  // If rawUrl is already a valid public HTTP(S) URL, return it
  if (isPublicHttpUrl(rawUrl)) {
    return rawUrl!;
  }

  // If file is provided, upload it and return the public URL
  if (file) {
    return await uploadReferenceImage({ file, userId });
  }

  // Neither valid URL nor file provided
  throw new Error("Please provide a public image URL or select a file to upload.");
}
