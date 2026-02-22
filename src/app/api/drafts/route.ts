import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { draftKindSchema, draftPayloadSchema } from '@/lib/contracts/api'
import { deleteDraft, getDraft, setDraft } from '@/lib/server-drafts'

function parseKind(value: string | null): 'analysis' | 'cover-letter' | null {
  const parsed = draftKindSchema.safeParse(value)
  if (!parsed.success) {
    return null
  }

  return parsed.data
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID()
  const userId = await getAuthenticatedUser()
  if (!userId) {
    return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required')
  }

  const kind = parseKind(request.nextUrl.searchParams.get('kind'))
  if (!kind) {
    return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid draft kind')
  }

  const draft = getDraft(userId, kind)
  return apiSuccess({
    kind,
    draft: draft?.payload ?? null,
    updatedAt: draft?.updatedAt ?? null,
    requestId,
  })
}

export async function PUT(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID()
  const userId = await getAuthenticatedUser()
  if (!userId) {
    return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required')
  }

  const body = await request.json().catch(() => null)
  const kind = parseKind(body?.kind ?? null)
  if (!kind) {
    return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid draft kind')
  }

  const payloadParse = draftPayloadSchema.safeParse(body?.draft)
  if (!payloadParse.success) {
    return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid draft payload', payloadParse.error.flatten())
  }

  const updatedAt = setDraft(userId, kind, payloadParse.data)
  return apiSuccess({
    kind,
    draft: payloadParse.data,
    updatedAt,
    requestId,
  })
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID()
  const userId = await getAuthenticatedUser()
  if (!userId) {
    return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required')
  }

  const kind = parseKind(request.nextUrl.searchParams.get('kind'))
  if (!kind) {
    return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid draft kind')
  }

  deleteDraft(userId, kind)
  return apiSuccess({ success: true, requestId })
}
