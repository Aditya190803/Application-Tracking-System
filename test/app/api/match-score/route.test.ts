import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/match-score/route';

vi.mock('@/lib/gemini', () => ({
    analyzeResume: vi.fn().mockResolvedValue('Match Score: 85%'),
}));

describe('/api/match-score', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if text is missing', async () => {
        const req = new NextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return score', async () => {
        const req = new NextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'R',
                jobDescription: 'J',
            }),
        });
        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.score).toBe(85);
    });
});
