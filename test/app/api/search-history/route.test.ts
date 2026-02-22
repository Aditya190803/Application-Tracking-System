import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/search-history/route';
import { getAuthenticatedUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/convex-server', () => ({
  getSearchHistory: vi.fn().mockResolvedValue({
    items: [{ id: 'h1', type: 'analysis', createdAt: new Date().toISOString(), result: '{}', analysisType: 'match' }],
    nextCursor: null,
  }),
}));

describe('/api/search-history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/search-history?limit=10');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid limit', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');

    const req = new NextRequest('http://localhost/api/search-history?limit=9999');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});
