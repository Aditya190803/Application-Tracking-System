import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/generate-cover-letter/route';

const mockAnalyzePost = vi.fn();

vi.mock('@/app/api/analyze/route', () => ({
  POST: (request: NextRequest) => mockAnalyzePost(request),
}));

describe('/api/generate-cover-letter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/generate-cover-letter', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('forwards to /api/analyze and returns transformed response', async () => {
    mockAnalyzePost.mockResolvedValue(new Response(JSON.stringify({
      result: 'Hello there',
      cached: false,
      documentId: 'doc-1',
      requestId: 'r1',
    }), { status: 200 }));

    const req = new NextRequest('http://localhost/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: 'resume text',
        jobDescription: 'job description',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.result).toBe('Hello there');
    expect(data.wordCount).toBe(2);
    expect(data.documentId).toBe('doc-1');
  });

  it('returns upstream analyze errors', async () => {
    mockAnalyzePost.mockResolvedValue(new Response(JSON.stringify({
      code: 'RATE_LIMITED',
      message: 'too many requests',
    }), { status: 429 }));

    const req = new NextRequest('http://localhost/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: 'resume text',
        jobDescription: 'job description',
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(429);
  });
});
