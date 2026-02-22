interface LogPayload {
  event: string
  requestId?: string
  route?: string
  latencyMs?: number
  cacheSource?: 'memory' | 'database' | 'none'
  modelFailure?: boolean
  [key: string]: unknown
}

export function logInfo(payload: LogPayload) {
  console.info('[obs]', JSON.stringify(payload))
}

export function logError(payload: LogPayload) {
  console.error('[obs]', JSON.stringify(payload))
}
