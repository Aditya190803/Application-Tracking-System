import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

export function apiError(
  requestId: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ code, message, details, requestId }, { status });
}

export function apiSuccess<T>(payload: T): NextResponse<T> {
  return NextResponse.json(payload);
}
