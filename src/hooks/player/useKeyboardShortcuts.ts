import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;

      if (isInput) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          config.onPlayPause?.();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          config.onSeekBackward?.();
          break;

        case 'ArrowRight':
          e.preventDefault();
          config.onSeekForward?.();
          break;

        case 'ArrowUp':
          e.preventDefault();
          config.onVolumeUp?.();
          break;

        case 'ArrowDown':
          e.preventDefault();
          config.onVolumeDown?.();
          break;
      }

      if (e.key === 'MediaPlayPause' || e.key === 'MediaPlay' || e.key === 'MediaPause') {
        e.preventDefault();
        config.onPlayPause?.();
      }

      if (e.key === 'MediaTrackNext') {
        e.preventDefault();
        config.onNext?.();
      }

      if (e.key === 'MediaTrackPrevious') {
        e.preventDefault();
        config.onPrevious?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [config]);
}

