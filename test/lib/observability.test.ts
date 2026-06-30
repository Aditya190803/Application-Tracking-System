import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  flushObservabilitySafely,
  logError,
  logInfo,
  logSafeFileName,
  sanitizeLogErrorMessage,
} from '@/lib/observability';

describe('observability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AXIOM_TOKEN;
    delete process.env.AXIOM_DATASET;
    delete process.env.AXIOM_EDGE;
  });

  describe('sanitizeLogErrorMessage', () => {
    it('returns undefined when details disabled', () => {
      expect(sanitizeLogErrorMessage(new Error('x'), false)).toBeUndefined();
    });

    it('returns message slice when details enabled', () => {
      expect(sanitizeLogErrorMessage(new Error('boom'), true)).toBe('boom');
    });

    it('returns unknown_error for non-Error when details enabled', () => {
      expect(sanitizeLogErrorMessage('nope', true)).toBe('unknown_error');
    });
  });

  describe('logSafeFileName', () => {
    it('strips path segments', () => {
      expect(logSafeFileName('C:\\Users\\resume.pdf')).toBe('resume.pdf');
    });

    it('returns unknown for empty basename', () => {
      expect(logSafeFileName('')).toBe('unknown');
    });
  });

  describe('logInfo / logError without Axiom env', () => {
    it('writes to stdout without throwing', () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logInfo({ event: 'test.info' });
      logError({ event: 'test.error' });

      expect(info).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('flushObservabilitySafely', () => {
    it('resolves when Axiom is not configured', async () => {
      await expect(flushObservabilitySafely()).resolves.toBeUndefined();
    });
  });
});