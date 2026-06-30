/** Build a user-visible error string from API JSON error bodies. */
export function formatApiErrorMessage(
  data: { message?: string; error?: string; requestId?: string; code?: string },
  fallback: string,
): string {
  const message = data.message || data.error || fallback
  if (data.requestId) {
    return `${message} (ref: ${data.requestId})`
  }
  return message
}