import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/export-cover-letter-docx/route';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn(),
}));

describe('/api/export-cover-letter-docx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUser).mockResolvedValue('user1');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 });
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ coverLetter: 'Hello' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetIn: 1000 });
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ coverLetter: 'Hello' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 400 when cover letter is missing', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});