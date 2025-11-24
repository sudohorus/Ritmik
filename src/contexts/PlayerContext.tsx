import React, { createContext, ReactNode, useState } from 'react';
import { Track } from '@/types/track';

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  seekToSeconds: number | null;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  seekTo: (seconds: number) => void;
  clearSeek: () => void;
}

export const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

interface PlayerProviderProps {
  children: ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);

  const playTrack = (track: Track, playlist?: Track[]) => {
    const isSameTrack = currentTrack?.videoId === track.videoId;
    
    if (isSameTrack) {
      setSeekToSeconds(0);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      setDuration(0);
      setQueue(playlist || [track]);
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const playNext = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t.videoId === currentTrack.videoId);
    const nextIndex = (currentIndex + 1) % queue.length;
    
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
  };

  const playPrevious = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(t => t.videoId === currentTrack.videoId);
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    
    setCurrentTrack(queue[prevIndex]);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  };

  const seekTo = (seconds: number) => {
    setSeekToSeconds(seconds);
  };

  const clearSeek = () => {
    setSeekToSeconds(null);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        volume,
        progress,
        duration,
        seekToSeconds,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        setVolume,
        setProgress,
        setDuration,
        seekTo,
        clearSeek,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = React.useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

