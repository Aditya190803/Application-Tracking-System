import { Axiom } from '@axiomhq/js'

export type LogLevel = 'info' | 'error'

export interface LogPayload {
  event: string
  level?: LogLevel
  requestId?: string
  route?: string
  latencyMs?: number
  cacheSource?: 'memory' | 'database' | 'none'
  modelFailure?: boolean
  code?: string
  errorMessage?: string
  fileSize?: number
  fileName?: string
  pageCount?: number
  [key: string]: unknown
}

const SERVICE = process.env.AXIOM_SERVICE || 'ats'
const DATASET = process.env.AXIOM_DATASET
const TOKEN = process.env.AXIOM_TOKEN
const EDGE = process.env.AXIOM_EDGE?.trim()

let axiomClient: Axiom | null = null

function getAxiom(): Axiom | null {
  if (!DATASET || !TOKEN) return null
  if (!axiomClient) {
    axiomClient = new Axiom({
      token: TOKEN,
      ...(EDGE ? { edge: EDGE } : {}),
    })
  }
  return axiomClient
}

function enrich(payload: LogPayload, level: LogLevel): LogPayload {
  return {
    ...payload,
    level,
    service: SERVICE,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  }
}

function emitToStdout(payload: LogPayload, level: LogLevel) {
  const line = JSON.stringify(enrich(payload, level))
  if (level === 'error') {
    console.error('[obs]', line)
  } else {
    console.info('[obs]', line)
  }
}

function ingestToAxiom(payload: LogPayload, level: LogLevel) {
  const client = getAxiom()
  if (!client || !DATASET) return

  const event = enrich(payload, level)
  // ponytail: fire-and-forget ingest; flush() in route finally batches delivery
  try {
    client.ingest(DATASET, [event])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'axiom ingest failed'
    console.error('[obs]', JSON.stringify({ event: 'observability.axiom_ingest_failed', errorMessage: message }))
  }
}

function log(level: LogLevel, payload: LogPayload) {
  emitToStdout(payload, level)
  ingestToAxiom(payload, level)
}

export function logInfo(payload: LogPayload) {
  log('info', payload)
}

export function logError(payload: LogPayload) {
  log('error', { ...payload, level: 'error' })
}

export async function flushObservability(): Promise<void> {
  const client = getAxiom()
  if (!client) return
  await client.flush()
}

/** Never fail the HTTP response if Axiom flush fails (serverless). */
export async function flushObservabilitySafely(): Promise<void> {
  try {
    await flushObservability()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message.slice(0, 300) : 'flush_failed'
    emitToStdout(
      { event: 'observability.flush_failed', errorMessage },
      'error',
    )
    ingestToAxiom({ event: 'observability.flush_failed', errorMessage }, 'error')
  }
}

export function sanitizeLogErrorMessage(error: unknown, includeDetails: boolean): string | undefined {
  if (!includeDetails) return undefined
  return error instanceof Error ? error.message.slice(0, 500) : 'unknown_error'
}

/** Safe basename for logs (no path segments). */
export function logSafeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || 'unknown'
  return base.slice(0, 200)
}