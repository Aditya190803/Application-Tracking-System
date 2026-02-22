import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE, GET, PUT } from '@/app/api/drafts/route'
import { getAuthenticatedUser } from '@/lib/auth'

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}))

describe('/api/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1')
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null)
    const res = await GET(new NextRequest('http://localhost/api/drafts?kind=analysis'))
    expect(res.status).toBe(401)
  })

  it('stores and loads a draft', async () => {
    const putRes = await PUT(new NextRequest('http://localhost/api/drafts', {
      method: 'PUT',
      body: JSON.stringify({
        kind: 'analysis',
        draft: { jobDescription: 'JD' },
      }),
    }))
    const putData = await putRes.json()
    expect(putRes.status).toBe(200)
    expect(putData.draft.jobDescription).toBe('JD')

    const getRes = await GET(new NextRequest('http://localhost/api/drafts?kind=analysis'))
    const getData = await getRes.json()
    expect(getRes.status).toBe(200)
    expect(getData.draft.jobDescription).toBe('JD')
  })

  it('deletes a draft', async () => {
    await PUT(new NextRequest('http://localhost/api/drafts', {
      method: 'PUT',
      body: JSON.stringify({
        kind: 'cover-letter',
        draft: { companyName: 'Acme' },
      }),
    }))

    const deleteRes = await DELETE(new NextRequest('http://localhost/api/drafts?kind=cover-letter', {
      method: 'DELETE',
    }))
    expect(deleteRes.status).toBe(200)

    const getRes = await GET(new NextRequest('http://localhost/api/drafts?kind=cover-letter'))
    const getData = await getRes.json()
    expect(getData.draft).toBeNull()
  })
})
