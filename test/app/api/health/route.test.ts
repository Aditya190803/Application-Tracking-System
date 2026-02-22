import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/health-check', () => ({
  runDependencyHealthChecks: vi.fn(),
}));

import { GET } from '@/app/api/health/route';
import { runDependencyHealthChecks } from '@/lib/health-check';

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 and health status', async () => {
    vi.mocked(runDependencyHealthChecks).mockResolvedValue({
      gemini: { status: 'ok', latencyMs: 120 },
      convex: { status: 'ok', latencyMs: 80 },
      auth: { status: 'ok', latencyMs: 60 },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.services.gemini.status).toBe('ok');
    expect(data.services.convex.status).toBe('ok');
    expect(data.services.auth.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('returns 206 when any service is degraded', async () => {
    vi.mocked(runDependencyHealthChecks).mockResolvedValue({
      gemini: { status: 'degraded', latencyMs: 120, details: 'Probe failed' },
      convex: { status: 'ok', latencyMs: 80 },
      auth: { status: 'ok', latencyMs: 60 },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(206);
    expect(data.status).toBe('degraded');
  });

  it('returns 503 when any service is missing', async () => {
    vi.mocked(runDependencyHealthChecks).mockResolvedValue({
      gemini: { status: 'missing', details: 'Missing API key' },
      convex: { status: 'ok', latencyMs: 80 },
      auth: { status: 'ok', latencyMs: 60 },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe('degraded');
  });
});
