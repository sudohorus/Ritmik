import { useEffect, useRef } from 'react';

/**
 * Hook que detecta quando o usuário volta para a aba depois de alt+tab
 * e executa uma função de reset para limpar estados travados
 */
export function useVisibilityReset(resetFn: () => void) {
  const wasHiddenRef = useRef(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Aba ficou oculta
        wasHiddenRef.current = true;
        console.log('[useVisibilityReset] Tab hidden');
      } else if (wasHiddenRef.current) {
        // Aba voltou ao foco depois de estar oculta
        console.log('[useVisibilityReset] Tab visible again - scheduling reset');
        wasHiddenRef.current = false;
        
        // ✅ Aguardar 500ms antes de resetar (dar tempo para eventos se estabilizarem)
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        
        resetTimeoutRef.current = setTimeout(() => {
          console.log('[useVisibilityReset] Executing reset function');
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