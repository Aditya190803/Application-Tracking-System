import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/extract-skills/route';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';

vi.mock('@/lib/gemini', () => ({
  analyzeResume: vi.fn().mockResolvedValue('{"technical_skills":["JS"], "analytical_skills":[], "soft_skills":[]}'),
}));

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn(),
}));

describe('/api/extract-skills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user1');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 });
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ resumeText: 'I know JS' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetIn: 1000 });
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ resumeText: 'I know JS' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
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