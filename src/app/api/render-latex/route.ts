import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  buildLatexCompileUrl,
  compileLatexViaUpload,
  shouldUseLatexUploadMode,
} from '@/lib/latex-render';

const renderRequestSchema = z.object({
  latexSource: z.string().trim().min(1).max(120000),
});

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const parse = renderRequestSchema.safeParse(await request.json());
    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid request payload', parse.error.flatten());
    }

    const latexSource = parse.data.latexSource;
    const upstream = shouldUseLatexUploadMode(latexSource)
      ? await compileLatexViaUpload(latexSource)
      : await fetch(buildLatexCompileUrl(latexSource), {
        method: 'GET',
        headers: { Accept: 'application/pdf' },
        cache: 'no-store',
      });

    const payload = await upstream.arrayBuffer();

    if (!upstream.ok) {
      const text = Buffer.from(payload).toString('utf-8').slice(0, 1200);
      return apiError(requestId, 422, 'LATEX_COMPILE_FAILED', 'LaTeX compilation failed', { log: text || 'Compilation error' });
    }

    return new NextResponse(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
        'x-request-id': requestId,
      },
    });
  } catch (error) {
    console.error('Latex render error', { requestId, error });
    return apiError(requestId, 500, 'LATEX_RENDER_FAILED', 'Failed to render LaTeX');
  }
}
