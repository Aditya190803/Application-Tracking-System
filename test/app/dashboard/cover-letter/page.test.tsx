import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPush = vi.fn()
const mockAddToast = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@stackframe/stack', () => ({
  useUser: () => ({ id: 'user-1' }),
}))

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}))

vi.mock('@/components/resume/ResumeSelect', () => ({
  ResumeSelect: ({ onSelect }: { onSelect: (text: string, name: string) => void }) => (
    <button type="button" onClick={() => onSelect('resume text', 'resume.pdf')}>
      Select Resume
    </button>
  ),
}))

import CoverLetterPage from '@/app/dashboard/cover-letter/page'

describe('/dashboard/cover-letter page flow', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockAddToast.mockReset()
    const local = new Map<string, string>()
    const session = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => local.get(k) ?? null,
        setItem: (k: string, v: string) => local.set(k, v),
        removeItem: (k: string) => local.delete(k),
      },
    })
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => session.get(k) ?? null,
        setItem: (k: string, v: string) => session.set(k, v),
      },
    })

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input)
      if (url.startsWith('/api/search-history')) {
        return {
          ok: true,
          json: async () => ({ history: [] }),
        } as Response
      }
      if (url.startsWith('/api/drafts')) {
        if (init?.method === 'PUT' || init?.method === 'DELETE') {
          return { ok: true, json: async () => ({}) } as Response
        }
        return {
          ok: true,
          json: async () => ({ draft: null }),
        } as Response
      }

      return { ok: true, json: async () => ({}) } as Response
    }))
  })

  it('creates pending cover letter payload and routes to /new', async () => {
    render(<CoverLetterPage />)

    const selectResumeButton = await screen.findByRole('button', { name: 'Select Resume' })
    await userEvent.click(selectResumeButton)
    await userEvent.type(screen.getByRole('textbox', { name: /job description/i }), 'Role requirements')
    await userEvent.click(screen.getByRole('button', { name: /Generate Cover Letter/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/cover-letter/new')
    })

    const pending = sessionStorage.getItem('pendingCoverLetterGeneration')
    expect(pending).toBeTruthy()
    expect(JSON.parse(String(pending)).tone).toBe('professional')
  })
})
