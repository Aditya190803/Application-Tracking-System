import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { POST as analyzeRoutePost } from '@/app/api/analyze/route';
import { apiError } from '@/lib/api-response';
import { withTimeout } from '@/lib/async-timeout';
import { analysisResponseSchema, coverLetterRequestSchema } from '@/lib/contracts/api';

const COVER_LETTER_ROUTE_TIMEOUT_MS = Number(process.env.COVER_LETTER_ROUTE_TIMEOUT_MS || 35000);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const rawBody = await request.json();
    const parse = coverLetterRequestSchema.safeParse(rawBody);

    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid request payload', parse.error.flatten());
    }

    const normalizedBody = {
      ...parse.data,
      analysisType: 'coverLetter' as const,
    };

    const headers = new Headers(request.headers);
    headers.set('content-type', 'application/json');
    headers.set('x-request-id', requestId);

    const forwardedRequest = new NextRequest('http://internal/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(normalizedBody),
    });

    const analyzeResponse = await withTimeout(
      analyzeRoutePost(forwardedRequest),
      COVER_LETTER_ROUTE_TIMEOUT_MS,
      'Cover letter generation timed out. Please try again.',
    );
    const data = await analyzeResponse.json();

    if (!analyzeResponse.ok) {
      return NextResponse.json(data, { status: analyzeResponse.status });
    }

    const upstream = analysisResponseSchema.safeParse(data);
    if (!upstream.success) {
      return apiError(requestId, 500, 'UPSTREAM_CONTRACT_MISMATCH', 'Unexpected analyze response shape');
    }

    const resultText = typeof upstream.data.result === 'string' ? upstream.data.result : '';
    const wordCount = resultText.trim().length === 0 ? 0 : resultText.trim().split(/\s+/).length;

    return NextResponse.json({
      result: resultText,
      wordCount,
      tone: parse.data.tone,
      length: parse.data.length,
      cached: upstream.data.cached,
      source: upstream.data.source,
      documentId: upstream.data.documentId,
      requestId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      return apiError(requestId, 504, 'COVER_LETTER_TIMEOUT', error.message);
    }
    console.error('Cover letter generation error', { requestId, error });
    return apiError(requestId, 500, 'COVER_LETTER_FAILED', 'Failed to generate cover letter');
  }
}
