import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { DELETE, GET } from '@/app/api/history/[id]/route';
import { getAuthenticatedUser } from '@/lib/auth';
import { deleteAnalysis, getAnalysisById, getCoverLetterById } from '@/lib/convex-server';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/convex-server', () => ({
  getAnalysisById: vi.fn(),
  getCoverLetterById: vi.fn(),
  deleteAnalysis: vi.fn().mockResolvedValue(true),
  deleteCoverLetter: vi.fn().mockResolvedValue(true),
}));

describe('GET /api/history/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/history/item-1?type=analysis');
    const res = await GET(req, { params: Promise.resolve({ id: 'item-1' }) });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid type', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');

    const req = new NextRequest('http://localhost/api/history/item-1?type=invalid');
    const res = await GET(req, { params: Promise.resolve({ id: 'item-1' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toContain('Invalid type');
  });

  it('returns analysis item when type=analysis and owned by user', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');
    vi.mocked(getAnalysisById).mockResolvedValue({
      _id: 'analysis-1',
      _creationTime: 1700000000000,
      userId: 'user-1',
      result: '{"matchScore":90}',
      jobTitle: 'Engineer',
      companyName: 'Acme',
    } as never);

    const req = new NextRequest('http://localhost/api/history/analysis-1?type=analysis');
    const res = await GET(req, { params: Promise.resolve({ id: 'analysis-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.item.type).toBe('analysis');
    expect(data.item.id).toBe('analysis-1');
    expect(data.item.companyName).toBe('Acme');
    expect(getAnalysisById).toHaveBeenCalledWith('analysis-1');
    expect(getCoverLetterById).not.toHaveBeenCalled();
  });

  it('returns cover letter item when type=cover-letter and owned by user', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');
    vi.mocked(getCoverLetterById).mockResolvedValue({
      _id: 'cover-1',
      _creationTime: 1700000000000,
      userId: 'user-1',
      result: 'cover letter text',
      companyName: 'Acme',
      jobDescription: 'JD',
    } as never);

    const req = new NextRequest('http://localhost/api/history/cover-1?type=cover-letter');
    const res = await GET(req, { params: Promise.resolve({ id: 'cover-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.item.type).toBe('cover-letter');
    expect(data.item.id).toBe('cover-1');
    expect(data.item.companyName).toBe('Acme');
    expect(getCoverLetterById).toHaveBeenCalledWith('cover-1');
    expect(getAnalysisById).not.toHaveBeenCalled();
  });

  it('returns 403 when requesting someone else\'s item', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');
    vi.mocked(getAnalysisById).mockResolvedValue({
      _id: 'analysis-1',
      _creationTime: 1700000000000,
      userId: 'user-2',
      result: '{}',
    } as never);

    const req = new NextRequest('http://localhost/api/history/analysis-1?type=analysis');
    const res = await GET(req, { params: Promise.resolve({ id: 'analysis-1' }) });

    expect(res.status).toBe(403);
  });

  it('deletes owned analysis item', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');
    vi.mocked(getAnalysisById).mockResolvedValue({
      _id: 'analysis-1',
      _creationTime: 1700000000000,
      userId: 'user-1',
      result: '{}',
    } as never);

    const req = new NextRequest('http://localhost/api/history/analysis-1?type=analysis', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'analysis-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(deleteAnalysis).toHaveBeenCalledWith('analysis-1');
  });
});
