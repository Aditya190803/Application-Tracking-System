import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/resume/ResumeSelect', () => ({
  ResumeSelect: ({ onSelect }: { onSelect: (text: string, name: string) => void }) => (
    <button type="button" onClick={() => onSelect('resume text', 'resume.pdf')}>
      Select Resume
    </button>
  ),
}))

import AnalysisPage from '@/app/dashboard/analysis/page'

describe('/dashboard/analysis page flow', () => {
  beforeEach(() => {
    mockPush.mockReset()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
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
  })

  it('creates pending analysis payload and routes to /new', async () => {
    render(<AnalysisPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Select Resume' }))
    await userEvent.type(screen.getByRole('textbox', { name: /job description/i }), 'Job description text')
    await userEvent.click(screen.getByRole('button', { name: /Analyze Match/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/analysis/new')
    })

    const pending = sessionStorage.getItem('pendingAnalysisGeneration')
    expect(pending).toBeTruthy()
    expect(JSON.parse(String(pending)).analysisType).toBe('match')
  })
})
