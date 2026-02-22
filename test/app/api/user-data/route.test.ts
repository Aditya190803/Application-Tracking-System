import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE, GET } from '@/app/api/user-data/route'
import { getAuthenticatedUser } from '@/lib/auth'
import { deleteAnalysis, deleteCoverLetter, deleteResume } from '@/lib/convex-server'

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}))

vi.mock('@/lib/convex-server', () => ({
  getUserResumes: vi.fn().mockResolvedValue([{ _id: 'resume-1' }]),
  getUserAnalyses: vi.fn().mockResolvedValue([{ _id: 'analysis-1' }]),
  getUserCoverLetters: vi.fn().mockResolvedValue([{ _id: 'cover-1' }]),
  deleteResume: vi.fn().mockResolvedValue(true),
  deleteAnalysis: vi.fn().mockResolvedValue(true),
  deleteCoverLetter: vi.fn().mockResolvedValue(true),
}))

describe('/api/user-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/user-data'))
    expect(response.status).toBe(401)
  })

  it('exports user data', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1')

    const response = await GET(new NextRequest('http://localhost/api/user-data'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.resumes)).toBe(true)
    expect(Array.isArray(data.analyses)).toBe(true)
    expect(Array.isArray(data.coverLetters)).toBe(true)
  })

  it('deletes user data', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1')

    const response = await DELETE(new NextRequest('http://localhost/api/user-data', {
      method: 'DELETE',
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(deleteResume).toHaveBeenCalledWith('resume-1')
    expect(deleteAnalysis).toHaveBeenCalledWith('analysis-1')
    expect(deleteCoverLetter).toHaveBeenCalledWith('cover-1')
  })
})
