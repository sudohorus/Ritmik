import { useState, useEffect, useRef, DependencyList } from 'react';

interface UseAsyncDataOptions<T> {
  fetchFn: () => Promise<T>;
  dependencies?: DependencyList;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAsyncData<T>({
  fetchFn,
  dependencies = [],
  enabled = true,
  onSuccess,
  onError,
}: UseAsyncDataOptions<T>): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeFetch = async () => {
    if (!enabled || !mountedRef.current) return;

    const currentFetchId = ++fetchIdRef.current;
    
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (currentFetchId === fetchIdRef.current && mountedRef.current) {
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setLoading(false);
        onError?.(error);
      }
    }
  };

  useEffect(() => {
    executeFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: executeFetch,
  };
}

