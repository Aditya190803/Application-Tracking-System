import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { GET as getSearchHistory } from '@/app/api/search-history/route';
import { GET as getUserStats } from '@/app/api/user-stats/route';
import { getAuthenticatedUser } from '@/lib/auth';

vi.mock('@/lib/convex-server', () => ({
    getSearchHistory: vi.fn().mockResolvedValue({ items: [{ id: 'h1' }], nextCursor: null }),
    getUserStats: vi.fn().mockResolvedValue({ totalScans: 5 }),
}));

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
}));

describe('Data Fetching API Routes', () => {
    describe('/api/search-history', () => {
        it('should return search history', async () => {
            vi.mocked(getAuthenticatedUser).mockResolvedValue('u1');
            const req = new NextRequest('http://localhost/api/search-history?limit=20');
            const res = await getSearchHistory(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.history).toHaveLength(1);
        });
    });

    describe('/api/user-stats', () => {
        it('should return user stats', async () => {
            vi.mocked(getAuthenticatedUser).mockResolvedValue('u1');
            const req = new NextRequest('http://localhost/api/user-stats');
            const res = await getUserStats(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.totalScans).toBe(5);
        });
    });
});
