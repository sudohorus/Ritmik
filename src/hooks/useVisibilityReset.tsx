import { useEffect, useRef } from 'react';

export function useVisibilityReset(resetFn: () => void) {
  const wasHiddenRef = useRef(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current) {;
        wasHiddenRef.current = false;
        
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        
        resetTimeoutRef.current = setTimeout(() => {
          resetFn();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [resetFn]);
}