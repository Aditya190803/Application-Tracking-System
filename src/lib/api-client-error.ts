/** Build a user-visible error string from API JSON error bodies. */
export function formatApiErrorMessage(data: unknown, fallback: string): string {
  const payload =
    data !== null && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}
  const message =
    typeof payload.message === 'string' && payload.message
      ? payload.message
      : typeof payload.error === 'string' && payload.error
        ? payload.error
        : fallback
  if (typeof payload.requestId === 'string' && payload.requestId) {
    return `${message} (ref: ${payload.requestId})`
  }
  return message
}