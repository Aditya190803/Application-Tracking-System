import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let currentSlug = 'new';
const mockReplace = vi.fn();
const mockFetch = vi.fn();
const mockRouter = { replace: mockReplace };

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: currentSlug }),
  useRouter: () => mockRouter,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import CoverLetterSlugPage from '@/app/dashboard/cover-letter/[slug]/page';

function createResponse(ok: boolean, status: number, payload: unknown): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('/dashboard/cover-letter/[slug] flow', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    sessionStorage.clear();
    currentSlug = 'new';
  });

  it('redirects from /dashboard/cover-letter/new to generated document slug', async () => {
    sessionStorage.setItem('pendingCoverLetterGeneration', JSON.stringify({
      resumeText: 'Resume text',
      jobDescription: 'Job description',
      tone: 'professional',
      length: 'standard',
    }));

    mockFetch.mockResolvedValue(createResponse(true, 200, {
      documentId: 'cover-123',
      result: 'Cover letter text',
    }));

    render(<CoverLetterSlugPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/cover-letter/cover-123');
    });
  });

  it('shows error when pending session payload is missing', async () => {
    render(<CoverLetterSlugPage />);

    expect(await screen.findByText('No pending cover letter request found. Please generate again.')).toBeInTheDocument();
  });

  it('shows API error state when generation request fails', async () => {
    sessionStorage.setItem('pendingCoverLetterGeneration', JSON.stringify({
      resumeText: 'Resume text',
      jobDescription: 'Job description',
      tone: 'professional',
      length: 'standard',
    }));

    mockFetch.mockResolvedValue(createResponse(false, 500, {
      error: 'Cover letter generation failed',
    }));

    render(<CoverLetterSlugPage />);

    expect(await screen.findByText('Cover letter generation failed')).toBeInTheDocument();
  });

  it('retries generation automatically after a transient failure', async () => {
    sessionStorage.setItem('pendingCoverLetterGeneration', JSON.stringify({
      resumeText: 'Resume text',
      jobDescription: 'Job description',
      tone: 'professional',
      length: 'standard',
    }));

    mockFetch
      .mockResolvedValueOnce(createResponse(false, 500, { error: 'Cover letter generation failed' }))
      .mockResolvedValueOnce(createResponse(true, 200, {
        documentId: 'cover-retry-1',
        result: 'Retry success',
      }));

    render(<CoverLetterSlugPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/cover-letter/cover-retry-1');
    });
  });
});
