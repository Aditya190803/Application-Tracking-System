import { getClient } from '@/lib/convex-server'
import { stackServerApp } from '@/stack/server'

interface ServiceHealth {
  status: 'ok' | 'degraded' | 'missing'
  latencyMs?: number
  details?: string
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function runDependencyHealthChecks(): Promise<{
  gemini: ServiceHealth
  convex: ServiceHealth
  auth: ServiceHealth
}> {
  const geminiStart = Date.now()
  let gemini: ServiceHealth = { status: process.env.GOOGLE_API_KEY ? 'degraded' : 'missing' }
  if (process.env.GOOGLE_API_KEY) {
    try {
      await withTimeout(fetch('https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta'), 2000)
      gemini = { status: 'ok', latencyMs: Date.now() - geminiStart }
    } catch {
      gemini = { status: 'degraded', latencyMs: Date.now() - geminiStart, details: 'Gemini endpoint probe failed' }
    }
  }

  const convexStart = Date.now()
  let convex: ServiceHealth = { status: process.env.NEXT_PUBLIC_CONVEX_URL ? 'degraded' : 'missing' }
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    try {
      const client = getClient()
      await withTimeout(client.query('functions:getUserStats', { userId: '__healthcheck__' }), 2000)
      convex = { status: 'ok', latencyMs: Date.now() - convexStart }
    } catch {
      convex = { status: 'degraded', latencyMs: Date.now() - convexStart, details: 'Convex query probe failed' }
    }
  }

  const authStart = Date.now()
  let auth: ServiceHealth = process.env.STACK_SECRET_SERVER_KEY
    ? { status: 'degraded' }
    : { status: 'missing' }
  if (process.env.STACK_SECRET_SERVER_KEY) {
    try {
      await withTimeout(stackServerApp.getUser(), 2000)
      auth = { status: 'ok', latencyMs: Date.now() - authStart }
    } catch {
      auth = { status: 'degraded', latencyMs: Date.now() - authStart, details: 'Auth provider probe failed' }
    }
  }

  return { gemini, convex, auth }
}
