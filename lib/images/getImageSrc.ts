/**
 * Utility to determine the best image source for Studio components
 * Uses direct URLs when possible, falls back to proxy for CORS issues
 */

/**
 * Check if a URL is a Replicate URL that might have CORS issues
 */
function isReplicateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('replicate') || 
           parsed.hostname.includes('replicate.delivery');
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a local blob URL (no proxy needed)
 */
function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Check if a URL is a local file URL (no proxy needed)
 */
function isLocalUrl(url: string): boolean {
  return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
}

/**
 * Get the appropriate image source for Studio components
 * @param url - The original image URL
 * @returns The URL to use in <img src> - either direct or proxied
 */
export function getImageSrc(url: string | null | undefined): string {
  if (!url) return '';
  
  // Local URLs and blob URLs don't need proxying
  if (isBlobUrl(url) || isLocalUrl(url)) {
    return url;
  }
  
  // For Replicate URLs, use proxy to avoid potential CORS issues
  if (isReplicateUrl(url)) {
    return `/api/proxy-image?u=${encodeURIComponent(url)}`;
  }
  
  // For other HTTPS URLs, try direct first (can be overridden by onError)
  return url;
}

/**
 * Get the fallback image source for error handling
 * @param originalUrl - The original image URL
 * @returns The fallback URL to use in onError
 */
export function getImageFallback(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '/placeholder.png';
  
  // If the original was proxied, try the direct URL as fallback
  if (originalUrl.startsWith('/api/proxy-image')) {
    const urlParam = new URLSearchParams(originalUrl.split('?')[1] || '').get('u');
    return urlParam || '/placeholder.png';
  }
  
  // Otherwise use placeholder
  return '/placeholder.png';
}



