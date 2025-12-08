/**
 * Fetch with retry logic and exponential backoff
 * Used for Studio API calls to handle network issues gracefully
 */

interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface FetchWithRetryResponse<T = any> extends Response {
  json(): Promise<T>;
}

/**
 * Fetch with retry logic using exponential backoff
 * @param url - The URL to fetch
 * @param options - Fetch options including retry configuration
 * @returns Promise<Response> - The successful response
 * @throws Error - If all retries fail
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<FetchWithRetryResponse> {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: "include", // Always include credentials for Studio API calls
      });

      // If response is successful, return it
      if (response.ok) {
        return response as FetchWithRetryResponse;
      }

      // If it's a client error (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }

      // For server errors (5xx) or network issues, throw to trigger retry
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      console.warn(
        `Fetch attempt ${attempt + 1}/${retries + 1} failed for ${url}:`,
        lastError.message,
        `Retrying in ${Math.round(delay)}ms...`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("All retry attempts failed");
}

/**
 * Convenience function for JSON responses with retry
 */
export async function fetchWithRetryJson<T = any>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options);
  return response.json();
}

/**
 * Convenience function for POST requests with JSON body and retry
 */
export async function fetchWithRetryPost<T = any>(
  url: string,
  body: any,
  options: Omit<FetchWithRetryOptions, 'method' | 'body'> = {}
): Promise<T> {
  return fetchWithRetryJson<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}



