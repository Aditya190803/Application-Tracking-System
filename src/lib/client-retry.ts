const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface RetrySignal {
  attempt: number
  maxAttempts: number
  waitMs: number
}

export async function withHttpRetry(
  request: () => Promise<Response>,
  options?: {
    maxAttempts?: number
    initialDelayMs?: number
    onRetry?: (signal: RetrySignal) => void
  },
): Promise<Response> {
  const maxAttempts = options?.maxAttempts ?? 3
  const initialDelayMs = options?.initialDelayMs ?? 350

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await request()

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === maxAttempts) {
      return response
    }

    const waitMs = Math.min(3000, initialDelayMs * 2 ** (attempt - 1))
    options?.onRetry?.({ attempt, maxAttempts, waitMs })
    await sleep(waitMs)
  }

  throw new Error('Request retry exhausted')
}
