import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import AnalysisSlugPage from '@/app/dashboard/analysis/[slug]/page';

function createResponse(ok: boolean, status: number, payload: unknown): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('/dashboard/analysis/[slug] flow', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    sessionStorage.clear();
    currentSlug = 'new';
  });

  it('redirects from /dashboard/analysis/new to generated document slug', async () => {
    sessionStorage.setItem('pendingAnalysisGeneration', JSON.stringify({
      resumeText: 'Resume text',
      jobDescription: 'Job description',
      analysisType: 'match',
      resumeName: 'resume.pdf',
    }));

    mockFetch.mockResolvedValue(createResponse(true, 200, {
      documentId: 'analysis-123',
      result: { matchScore: 80 },
      cached: false,
    }));

    render(<AnalysisSlugPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/analysis/analysis-123');
    });
  });

  it('shows error when pending session payload is missing', async () => {
    render(<AnalysisSlugPage />);

    expect(await screen.findByText('No pending analysis request found. Please start a new analysis.')).toBeInTheDocument();
  });

  it('shows API error state when generation request fails', async () => {
    sessionStorage.setItem('pendingAnalysisGeneration', JSON.stringify({
      resumeText: 'Resume text',
      jobDescription: 'Job description',
      analysisType: 'match',
    }));

    mockFetch.mockResolvedValue(createResponse(false, 500, {
      error: 'Generation failed',
    }));

    render(<AnalysisSlugPage />);

    expect(await screen.findByText('Generation failed')).toBeInTheDocument();
  });

  it('retries generation after failure when user clicks retry', async () => {
    sessionStorage.setItem('pendingAnalysisGeneration', JSON.stringify({
      resumeText: 'Resume text',
      jobDescription: 'Job description',
      analysisType: 'match',
    }));

    mockFetch
      .mockResolvedValueOnce(createResponse(false, 500, { error: 'Generation failed' }))
      .mockResolvedValueOnce(createResponse(false, 500, { error: 'Generation failed' }))
      .mockResolvedValueOnce(createResponse(true, 200, {
        documentId: 'analysis-retry-1',
        result: { matchScore: 88 },
        cached: false,
      }));

    render(<AnalysisSlugPage />);

    const retryButton = await screen.findByRole('button', { name: /Retry Generation/i });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/analysis/analysis-retry-1');
    });
  });
});
