import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/render-latex/route';
import { getAuthenticatedUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

describe('/api/render-latex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUser).mockResolvedValue('u1');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 400 for invalid payload', async () => {
    const request = new NextRequest('http://localhost/api/render-latex', {
      method: 'POST',
      body: JSON.stringify({ latexSource: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns compiled pdf', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    })));

    const request = new NextRequest('http://localhost/api/render-latex', {
      method: 'POST',
      body: JSON.stringify({ latexSource: '\\documentclass{article}\\begin{document}Hello\\end{document}' }),
    });

    const response = await POST(request);
    const buffer = await response.arrayBuffer();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it('returns compile error on upstream failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad latex', {
      status: 400,
    })));

    const request = new NextRequest('http://localhost/api/render-latex', {
      method: 'POST',
      body: JSON.stringify({ latexSource: '\\badcommand' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.code).toBe('LATEX_COMPILE_FAILED');
  });
});
