import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { DELETE,GET, POST } from '@/app/api/resumes/route';
import { getAuthenticatedUser } from '@/lib/auth';
import { getResumeById } from '@/lib/convex-server';

vi.mock('@/lib/convex-server', () => ({
    saveResume: vi.fn().mockResolvedValue({ _id: 'res1' }),
    getUserResumes: vi.fn().mockResolvedValue([{ _id: 'res1' }]),
    deleteResume: vi.fn().mockResolvedValue(true),
    getResumeById: vi.fn().mockResolvedValue({ _id: 'res1', userId: 'u1' }),
    generateHash: vi.fn().mockImplementation((value: string) => value),
}));

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
}));

describe('/api/resumes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthenticatedUser).mockResolvedValue('u1');
    });

    describe('POST', () => {
        it('should save resume', async () => {
            const req = new NextRequest('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'r.pdf',
                    textContent: 'text',
                }),
            });
            const res = await POST(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.resume._id).toBe('res1');
        });
    });

    describe('GET', () => {
        it('should fetch resumes', async () => {
            const req = new NextRequest('http://localhost/api/resumes');
            const res = await GET(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.resumes).toHaveLength(1);
        });
    });

    describe('DELETE', () => {
        it('should delete resume', async () => {
            const req = new NextRequest('http://localhost/api/resumes?resumeId=res1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
        });

        it("should reject deleting another user's resume", async () => {
            vi.mocked(getResumeById).mockResolvedValue({ _id: 'res1', userId: 'u2' } as never);

            const req = new NextRequest('http://localhost/api/resumes?resumeId=res1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            const data = await res.json();

            expect(res.status).toBe(403);
            expect(data.code).toBe('FORBIDDEN');
        });
    });
});
