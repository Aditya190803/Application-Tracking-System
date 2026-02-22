import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}))

vi.mock('@/stack/server', () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}))

import { proxy } from '@/proxy'

describe('dashboard proxy auth guard', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('redirects unauthenticated users to login with return path', async () => {
    mockGetUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/dashboard/analysis/new?tab=skills')
    const response = await proxy(request)

    expect(response.status).toBeGreaterThanOrEqual(300)
    expect(response.status).toBeLessThan(400)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/handler/login?after_auth_return_to=%2Fdashboard%2Fanalysis%2Fnew%3Ftab%3Dskills'
    )
  })

  it('allows authenticated users through', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-123' })

    const request = new NextRequest('http://localhost:3000/dashboard/history')
    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})
