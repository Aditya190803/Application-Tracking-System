import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

import { stackServerApp } from '@/stack/server';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
}

/**
 * Verify authentication for API routes
 * Returns user ID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  try {
    const user = await stackServerApp.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Middleware wrapper for protected API routes
 * Usage: export const POST = withAuth(async (request, userId) => { ... })
 */
export function withAuth<T>(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const userId = await getAuthenticatedUser();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ) as NextResponse<{ error: string }>;
    }

    return handler(request, userId);
  };
}

/**
 * Rate limiting with Redis (Upstash) and in-memory fallback
 */
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const allowMemoryRateLimitInProduction = process.env.ALLOW_IN_MEMORY_RATE_LIMIT === 'true';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 30 }
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();

  if (redis) {
    try {
      const windowSeconds = Math.ceil(config.windowMs / 1000);
      const key = `rate_limit:${identifier}:${Math.floor(now / config.windowMs)}`;

      const [count] = await redis.pipeline()
        .incr(key)
        .expire(key, windowSeconds)
        .exec();

      const currentCount = Number(count);
      return {
        allowed: currentCount <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - currentCount),
        resetIn: config.windowMs - (now % config.windowMs),
      };
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error);
    }
  }

  if (process.env.NODE_ENV === 'production' && !allowMemoryRateLimitInProduction) {
    throw new Error('RATE_LIMIT_BACKEND_UNCONFIGURED');
  }

  // Fallback memory implementation
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Middleware wrapper with both auth and rate limiting
 */
export function withAuthAndRateLimit<T>(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse<T>>,
  rateLimitConfig?: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const userId = await getAuthenticatedUser();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ) as NextResponse<{ error: string }>;
    }

    // Rate limit by user ID
    let rateLimit: Awaited<ReturnType<typeof checkRateLimit>>;
    try {
      rateLimit = await checkRateLimit(userId, rateLimitConfig);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT_BACKEND_UNCONFIGURED') {
        return NextResponse.json(
          { error: 'Rate limiting backend is not configured' },
          { status: 503 }
        ) as NextResponse<{ error: string }>;
      }

      throw error;
    }

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.` },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
          }
        }
      ) as NextResponse<{ error: string }>;
    }

    const response = await handler(request, userId);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetIn / 1000)));

    return response;
  };
}
