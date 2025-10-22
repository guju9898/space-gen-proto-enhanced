export function isPublicHttpUrl(value?: string | null): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);
    
    // Must be http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    // Must not be localhost
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
      return false;
    }
    
    // Must not be .local domain
    if (url.hostname.endsWith('.local')) {
      return false;
    }
    
    // Must not be bare IP address (basic check)
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(url.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
