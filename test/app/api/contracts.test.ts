import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as analyzePost } from '@/app/api/analyze/route'
import { GET as draftsGet, PUT as draftsPut } from '@/app/api/drafts/route'
import { POST as coverLetterPost } from '@/app/api/generate-cover-letter/route'
import { GET as resumesGet } from '@/app/api/resumes/route'
import { GET as searchHistoryGet } from '@/app/api/search-history/route'
import { GET as userStatsGet } from '@/app/api/user-stats/route'
import { getAuthenticatedUser } from '@/lib/auth'
import {
  analysisResponseSchema,
  coverLetterResponseSchema,
  draftResponseSchema,
  historyResponseSchema,
  resumesResponseSchema,
  userStatsResponseSchema,
} from '@/lib/contracts/api'

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 }),
}))

vi.mock('@/lib/gemini', () => ({
  analyzeResume: vi.fn().mockResolvedValue('Contract test response'),
  TONE_OPTIONS: { professional: {} },
  LENGTH_OPTIONS: { standard: {} },
}))

vi.mock('@/lib/convex-server', () => ({
  generateHash: vi.fn().mockReturnValue('hash'),
  getAnalysis: vi.fn().mockResolvedValue(null),
  getCoverLetter: vi.fn().mockResolvedValue(null),
  saveAnalysis: vi.fn().mockResolvedValue({ _id: 'analysis-1' }),
  saveCoverLetter: vi.fn().mockResolvedValue({ _id: 'cover-letter-1' }),
  getSearchHistory: vi.fn().mockResolvedValue({
    items: [{ id: 'h1', type: 'analysis', createdAt: new Date().toISOString(), result: '{}', analysisType: 'match' }],
    nextCursor: null,
  }),
  getUserResumes: vi.fn().mockResolvedValue([
    { _id: 'resume-1', _creationTime: Date.now(), name: 'resume.pdf', textContent: 'text', pageCount: 1, fileSize: 512 },
  ]),
  getUserStats: vi.fn().mockResolvedValue({
    totalScans: 1,
    avgScore: 80,
    draftsMade: 1,
    resumeCount: 1,
    analysisCount: 1,
    coverLetterCount: 0,
    averageMatchScore: 80,
  }),
}))

describe('API response contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1')
  })

  it('validates /api/analyze success contract', async () => {
    const response = await analyzePost(new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resumeText: 'resume',
        jobDescription: 'job',
        analysisType: 'overview',
      }),
    }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(analysisResponseSchema.safeParse(data).success).toBe(true)
  })

  it('validates /api/generate-cover-letter success contract', async () => {
    const response = await coverLetterPost(new NextRequest('http://localhost/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: 'resume',
        jobDescription: 'job',
      }),
    }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(coverLetterResponseSchema.safeParse(data).success).toBe(true)
  })

  it('validates /api/search-history success contract', async () => {
    const response = await searchHistoryGet(new NextRequest('http://localhost/api/search-history?limit=10'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(historyResponseSchema.safeParse(data).success).toBe(true)
  })

  it('validates /api/resumes success contract', async () => {
    const response = await resumesGet(new NextRequest('http://localhost/api/resumes'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(resumesResponseSchema.safeParse(data).success).toBe(true)
  })

  it('validates /api/user-stats success contract', async () => {
    const response = await userStatsGet(new NextRequest('http://localhost/api/user-stats'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(userStatsResponseSchema.safeParse(data).success).toBe(true)
  })

  it('validates /api/drafts success contract', async () => {
    await draftsPut(new NextRequest('http://localhost/api/drafts', {
      method: 'PUT',
      body: JSON.stringify({
        kind: 'analysis',
        draft: { jobDescription: 'jd' },
      }),
    }))

    const response = await draftsGet(new NextRequest('http://localhost/api/drafts?kind=analysis'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(draftResponseSchema.safeParse(data).success).toBe(true)
  })
})
