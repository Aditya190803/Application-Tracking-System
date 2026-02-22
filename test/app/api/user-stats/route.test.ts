import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/user-stats/route';
import { getAuthenticatedUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/convex-server', () => ({
  getUserStats: vi.fn().mockResolvedValue({ totalScans: 0 }),
}));

describe('/api/user-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/user-stats');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 200 when authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user-1');

    const req = new NextRequest('http://localhost/api/user-stats');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
