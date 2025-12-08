/**
 * Debug utility for image loading issues
 * Use this to troubleshoot why images aren't displaying
 */

export interface ImageDebugInfo {
  originalUrl: string;
  processedUrl: string;
  isReplicateUrl: boolean;
  isBlobUrl: boolean;
  isLocalUrl: boolean;
  needsProxy: boolean;
  proxyUrl?: string;
}

/**
 * Analyze an image URL and provide debug information
 */
export function debugImageUrl(url: string | null | undefined): ImageDebugInfo | null {
  if (!url) return null;

  const isReplicateUrl = url.includes('replicate') || url.includes('replicate.delivery');
  const isBlobUrl = url.startsWith('blob:');
  const isLocalUrl = url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  const needsProxy = isReplicateUrl && !isBlobUrl && !isLocalUrl;
  const proxyUrl = needsProxy ? `/api/proxy-image?u=${encodeURIComponent(url)}` : undefined;

  return {
    originalUrl: url,
    processedUrl: proxyUrl || url,
    isReplicateUrl,
    isBlobUrl,
    isLocalUrl,
    needsProxy,
    proxyUrl,
  };
}

/**
 * Test if an image URL is accessible
 */
export async function testImageUrl(url: string): Promise<{
  accessible: boolean;
  status?: number;
  error?: string;
  contentType?: string;
}> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || undefined,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log debug information for an image URL
 */
export function logImageDebug(url: string | null | undefined, context: string = 'Image') {
  if (!url) {
    console.log(`🔍 ${context}: No URL provided`);
    return;
  }

  const debug = debugImageUrl(url);
  if (!debug) return;

  console.group(`🔍 ${context} Debug`);
  console.log('Original URL:', debug.originalUrl);
  console.log('Processed URL:', debug.processedUrl);
  console.log('Is Replicate URL:', debug.isReplicateUrl);
  console.log('Is Blob URL:', debug.isBlobUrl);
  console.log('Is Local URL:', debug.isLocalUrl);
  console.log('Needs Proxy:', debug.needsProxy);
  if (debug.proxyUrl) {
    console.log('Proxy URL:', debug.proxyUrl);
  }
  console.groupEnd();

  // Test accessibility
  testImageUrl(debug.processedUrl).then(result => {
    console.group(`🌐 ${context} Accessibility Test`);
    console.log('Accessible:', result.accessible);
    if (result.status) console.log('Status:', result.status);
    if (result.contentType) console.log('Content-Type:', result.contentType);
    if (result.error) console.log('Error:', result.error);
    console.groupEnd();
  });
}



