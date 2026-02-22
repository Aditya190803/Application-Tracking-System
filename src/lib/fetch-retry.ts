const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface RetryOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const retries = options.retries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 4000;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    if (options.signal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }

    try {
      const response = await fetch(input, { ...init, signal: options.signal });
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
    }

    const exponential = initialDelayMs * 2 ** attempt;
    const jitter = Math.floor(Math.random() * 150);
    const waitMs = Math.min(maxDelayMs, exponential + jitter);
    await delay(waitMs);
    attempt += 1;
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Request failed after retries');
}
