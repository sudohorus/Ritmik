import { useContext } from 'react';
import { PlayerContext } from '@/contexts/PlayerContext';

export function usePlayer() {
  const context = useContext(PlayerContext);
  
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  
  return context;
}

