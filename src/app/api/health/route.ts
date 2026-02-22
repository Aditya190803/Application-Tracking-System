import { NextResponse } from 'next/server';

import { runDependencyHealthChecks } from '@/lib/health-check';

export async function GET() {
  const checks = await runDependencyHealthChecks();
  const hasDegraded = Object.values(checks).some((service) => service.status === 'degraded');
  const hasMissing = Object.values(checks).some((service) => service.status === 'missing');
  const statusCode = hasMissing ? 503 : hasDegraded ? 206 : 200;

  return NextResponse.json(
    {
      status: hasDegraded || hasMissing ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        gemini: checks.gemini,
        convex: checks.convex,
        auth: checks.auth,
      },
    },
    { status: statusCode },
  );
}
