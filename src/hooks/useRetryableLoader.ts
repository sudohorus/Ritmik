import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

export interface RetryableLoaderOptions {
  deps?: DependencyList;
  enabled?: boolean;
  stallMs?: number;
  maxRetries?: number;
}

export interface RetryableLoaderResult {
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useRetryableLoader(
  loader: () => Promise<void>,
  options: RetryableLoaderOptions = {}
): RetryableLoaderResult {
  const {
    deps = [],
    enabled = true,
    stallMs = 6000,
    maxRetries = 3,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [runKey, setRunKey] = useState(0);
  const retryCount = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const trigger = useCallback(() => {
    retryCount.current = 0;
    setRunKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      trigger();
    } else {
      setLoading(false);
      setError(null);
    }
  }, [enabled, trigger, ...deps]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let settled = false;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleRetry = () => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (!settled && retryCount.current < maxRetries - 1) {
          retryCount.current += 1;
          setRunKey((prev) => prev + 1);
        }
      }, stallMs);
    };

    const execute = async () => {
      setLoading(true);
      setError(null);
      scheduleRetry();
      try {
        await loader();
        settled = true;
        retryCount.current = 0;
      } catch (err) {
        const nextError = err instanceof Error ? err : new Error('Failed to load data');
        setError(nextError);
        if (retryCount.current < maxRetries - 1) {
          retryCount.current += 1;
          setRunKey((prev) => prev + 1);
        }
      } finally {
        settled = true;
        clearTimer();
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    execute();

    return () => {
      settled = true;
      clearTimer();
    };
  }, [loader, runKey, enabled, stallMs, maxRetries]);

  return {
    loading,
    error,
    retry: trigger,
  };
}

