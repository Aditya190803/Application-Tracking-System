import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/extract-skills/route';

vi.mock('@/lib/gemini', () => ({
    analyzeResume: vi.fn().mockResolvedValue('{"technical_skills":["JS"], "analytical_skills":[], "soft_skills":[]}'),
}));

describe('/api/extract-skills', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract skills from resume', async () => {
        const req = new NextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'I know JS',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.result).toContain('technical_skills');
    });

    it('should return 400 if resumeText is missing', async () => {
        const req = new NextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.message).toBe('Resume text is required');
    });
});
