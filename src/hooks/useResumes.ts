'use client';

import { useCallback, useEffect, useState } from 'react';

import { resumesResponseSchema } from '@/lib/contracts/api';
import { fetchWithRetry } from '@/lib/fetch-retry';
import type { ResumeItem } from '@/types/domain';

export function useResumes(limit = 10) {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithRetry(`/api/resumes?limit=${limit}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || payload.error || 'Failed to load resumes');
      }

      const parsed = resumesResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid resumes response');
      }

      setResumes(parsed.data.resumes as ResumeItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const removeResume = useCallback((resumeId: string) => {
    setResumes((current) => current.filter((item) => item._id !== resumeId));
  }, []);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  return {
    resumes,
    isLoading,
    error,
    refresh: loadResumes,
    removeResume,
    setResumes,
  };
}
