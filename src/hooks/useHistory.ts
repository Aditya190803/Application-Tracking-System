'use client';

import { useCallback, useEffect, useState } from 'react';

import { historyResponseSchema } from '@/lib/contracts/api';
import { fetchWithRetry } from '@/lib/fetch-retry';
import type { HistoryItem, HistoryType } from '@/types/domain';

export function useHistory(initialLimit = 20) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchPage = useCallback(async (nextCursor?: string) => {
    const params = new URLSearchParams({ limit: String(initialLimit) });
    if (nextCursor) {
      params.set('cursor', nextCursor);
    }

    const response = await fetchWithRetry(`/api/search-history?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || payload.error || 'Failed to load history');
    }

    const parsed = historyResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error('Invalid history response');
    }

    return parsed.data;
  }, [initialLimit]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await fetchPage();
      setHistory(page.history as HistoryItem[]);
      setCursor(page.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!cursor) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchPage(cursor);
      setHistory((current) => [...current, ...(page.history as HistoryItem[])]);
      setCursor(page.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more history');
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, fetchPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filterItems = useCallback((filter: 'all' | HistoryType) => {
    if (filter === 'all') {
      return history;
    }
    return history.filter((item) => item.type === filter);
  }, [history]);

  return {
    history,
    isLoading,
    isLoadingMore,
    error,
    hasMore: Boolean(cursor),
    refresh,
    loadMore,
    filterItems,
  };
}
