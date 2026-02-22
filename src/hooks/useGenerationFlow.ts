'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseGenerationFlowOptions {
  stepDurationMs?: number;
  estimatedTotalSeconds?: number;
}

export function useGenerationFlow(steps: string[], options: UseGenerationFlowOptions = {}) {
  const stepDurationMs = options.stepDurationMs ?? 2500;
  const estimatedTotalSeconds = options.estimatedTotalSeconds ?? Math.max(steps.length * 2, 10);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let stepTimer: NodeJS.Timeout | undefined;
    let elapsedTimer: NodeJS.Timeout | undefined;

    if (isGenerating) {
      setLoadingStep(0);
      setElapsedSeconds(0);

      stepTimer = setInterval(() => {
        setLoadingStep((current) => (current < steps.length - 1 ? current + 1 : current));
      }, stepDurationMs);

      elapsedTimer = setInterval(() => {
        setElapsedSeconds((current) => current + 1);
      }, 1000);
    }

    return () => {
      if (stepTimer) clearInterval(stepTimer);
      if (elapsedTimer) clearInterval(elapsedTimer);
    };
  }, [isGenerating, stepDurationMs, steps.length]);

  const estimatedSecondsRemaining = useMemo(() => {
    return Math.max(0, estimatedTotalSeconds - elapsedSeconds);
  }, [elapsedSeconds, estimatedTotalSeconds]);

  const runGeneration = useCallback(async <T>(executor: (signal: AbortSignal) => Promise<T>) => {
    setError(null);
    setIsGenerating(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      return await executor(controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Generation canceled.');
      }
      throw err;
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return {
    isGenerating,
    loadingStep,
    elapsedSeconds,
    estimatedSecondsRemaining,
    error,
    setError,
    runGeneration,
    cancelGeneration,
  };
}
