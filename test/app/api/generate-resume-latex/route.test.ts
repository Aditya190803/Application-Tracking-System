import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/generate-resume-latex/route';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { getTailoredResume, saveTailoredResume } from '@/lib/convex-server';
import { generateTailoredResumeData } from '@/lib/gemini';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  generateTailoredResumeData: vi.fn(),
}));

vi.mock('@/lib/convex-server', () => ({
  getTailoredResume: vi.fn(),
  saveTailoredResume: vi.fn(),
  generateHash: vi.fn((value: string) => `hash-${value.length}`),
}));

describe('/api/generate-resume-latex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUser).mockResolvedValue('u1');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 });
    vi.mocked(getTailoredResume).mockResolvedValue(null);
    vi.mocked(generateTailoredResumeData).mockResolvedValue({
      summary: 'Software engineer focused on distributed systems.',
      skills: ['TypeScript', 'Next.js', 'Node.js'],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      additional: [],
      keywordsUsed: ['scalability'],
      targetTitle: 'Senior Software Engineer',
    });
    vi.mocked(saveTailoredResume).mockResolvedValue({ _id: 'tr-1' } as never);
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/generate-resume-latex', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns cached tailored resume when available', async () => {
    vi.mocked(getTailoredResume).mockResolvedValue({
      _id: 'tr-cache',
      templateId: 'jake-classic',
      latexSource: '\\documentclass{article}',
      structuredData: JSON.stringify({ summary: 'cached' }),
    } as never);

    const req = new NextRequest('http://localhost/api/generate-resume-latex', {
      method: 'POST',
      body: JSON.stringify({
        resumeText: 'resume',
        jobDescription: 'job',
        templateId: 'jake-classic',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(data.documentId).toBe('tr-cache');
    expect(generateTailoredResumeData).not.toHaveBeenCalled();
  });

  it('generates and saves a tailored resume', async () => {
    const req = new NextRequest('http://localhost/api/generate-resume-latex', {
      method: 'POST',
      body: JSON.stringify({
        resumeText: 'resume text',
        jobDescription: 'job description',
        templateId: 'deedy-modern',
        resumeName: 'Resume.pdf',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cached).toBe(false);
    expect(data.templateId).toBe('deedy-modern');
    expect(data.documentId).toBe('tr-1');
    expect(data.latexSource).toContain('documentclass');
    expect(generateTailoredResumeData).toHaveBeenCalledTimes(1);
    expect(saveTailoredResume).toHaveBeenCalledTimes(1);
  });
});
