import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/analyze/route';
import { checkRateLimit,getAuthenticatedUser } from '@/lib/auth';

// Mock the libraries used in the route
vi.mock('@/lib/gemini', () => ({
    analyzeResume: vi.fn().mockResolvedValue('AI Analysis Result'),
    TONE_OPTIONS: { professional: {} },
    LENGTH_OPTIONS: { standard: {} },
}));

vi.mock('@/lib/convex-server', () => ({
    saveAnalysis: vi.fn().mockResolvedValue({ _id: 'analysis-123' }),
    getAnalysis: vi.fn().mockResolvedValue(null),
    saveCoverLetter: vi.fn().mockResolvedValue({ _id: 'cl-123' }),
    getCoverLetter: vi.fn().mockResolvedValue(null),
    generateHash: vi.fn().mockReturnValue('hash123'),
}));

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
    checkRateLimit: vi.fn(),
}));

describe('/api/analyze', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthenticatedUser).mockResolvedValue('user1');
        vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 });
    });

    it('should return 400 if resumeText or jobDescription is missing', async () => {
        const req = new NextRequest('http://localhost/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ analysisType: 'overview' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should process a valid request', async () => {
        const req = new NextRequest('http://localhost/api/analyze', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'Text',
                jobDescription: 'Job',
                analysisType: 'overview',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.result).toBe('AI Analysis Result');
        expect(data.documentId).toBe('analysis-123');
    });

    it('should return 400 for invalid analysis type', async () => {
        const req = new NextRequest('http://localhost/api/analyze', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'Text',
                jobDescription: 'Job',
                analysisType: 'invalid',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should skip cache when forceRegenerate is true', async () => {
        const req = new NextRequest('http://localhost/api/analyze', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'Text',
                jobDescription: 'Job',
                analysisType: 'overview',
                forceRegenerate: true,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.cached).toBe(false); // Should not be from cache
    });

    it('returns 400 for resume text payload that exceeds max size', async () => {
        const req = new NextRequest('http://localhost/api/analyze', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'x'.repeat(50001),
                jobDescription: 'Job',
                analysisType: 'overview',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('returns 503 when rate limit backend is not configured', async () => {
        vi.mocked(checkRateLimit).mockRejectedValueOnce(new Error('RATE_LIMIT_BACKEND_UNCONFIGURED'));

        const req = new NextRequest('http://localhost/api/analyze', {
            method: 'POST',
            body: JSON.stringify({
                resumeText: 'Text',
                jobDescription: 'Job',
                analysisType: 'overview',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(503);
        expect(data.code).toBe('RATE_LIMIT_BACKEND_UNCONFIGURED');
    });
});
