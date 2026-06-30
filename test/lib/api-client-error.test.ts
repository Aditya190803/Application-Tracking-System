import { describe, expect, it } from 'vitest';

import { formatApiErrorMessage } from '@/lib/api-client-error';

describe('formatApiErrorMessage', () => {
  it('uses message when present', () => {
    expect(formatApiErrorMessage({ message: 'Bad request' }, 'fallback')).toBe('Bad request');
  });

  it('uses error field when message missing', () => {
    expect(formatApiErrorMessage({ error: 'Legacy error' }, 'fallback')).toBe('Legacy error');
  });

  it('uses fallback when body empty', () => {
    expect(formatApiErrorMessage({}, 'fallback')).toBe('fallback');
  });

  it('appends requestId ref when provided', () => {
    expect(
      formatApiErrorMessage({ message: 'Failed', requestId: 'abc-123' }, 'fallback'),
    ).toBe('Failed (ref: abc-123)');
  });
});