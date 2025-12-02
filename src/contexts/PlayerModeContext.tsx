import { createContext, useContext, useState, ReactNode } from 'react';

export type PlayerMode = 'normal' | 'mini';

interface PlayerModeContextValue {
  mode: PlayerMode;
  setMode: (mode: PlayerMode) => void;
  toggleMini: () => void;
}

const PlayerModeContext = createContext<PlayerModeContextValue | undefined>(undefined);

export function PlayerModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlayerMode>('normal');

  const toggleMini = () => {
    setMode(prev => prev === 'mini' ? 'normal' : 'mini');
  };

  return (
    <PlayerModeContext.Provider value={{ mode, setMode, toggleMini }}>
      {children}
    </PlayerModeContext.Provider>
  );
}

export function usePlayerMode() {
  const context = useContext(PlayerModeContext);
  if (!context) {
    throw new Error('usePlayerMode must be used within PlayerModeProvider');
  }
  return context;
}