type DraftKind = 'analysis' | 'cover-letter'

interface StoredDraft {
  payload: Record<string, unknown>
  updatedAt: number
}

const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 14
const draftStore = new Map<string, StoredDraft>()

function key(userId: string, kind: DraftKind): string {
  return `${userId}:${kind}`
}

function sweep(now = Date.now()): void {
  for (const [k, value] of draftStore.entries()) {
    if (now - value.updatedAt > DRAFT_TTL_MS) {
      draftStore.delete(k)
    }
  }
}

export function getDraft(userId: string, kind: DraftKind): { payload: Record<string, unknown>; updatedAt: string } | null {
  sweep()
  const entry = draftStore.get(key(userId, kind))
  if (!entry) {
    return null
  }

  return {
    payload: entry.payload,
    updatedAt: new Date(entry.updatedAt).toISOString(),
  }
}

export function setDraft(userId: string, kind: DraftKind, payload: Record<string, unknown>): string {
  const updatedAt = Date.now()
  draftStore.set(key(userId, kind), { payload, updatedAt })
  if (Math.random() < 0.02) {
    sweep(updatedAt)
  }
  return new Date(updatedAt).toISOString()
}

export function deleteDraft(userId: string, kind: DraftKind): void {
  draftStore.delete(key(userId, kind))
}
