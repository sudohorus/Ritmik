import React, { createContext, ReactNode, useState, useRef } from 'react';
import { Track } from '@/types/track';

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
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
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);
  
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(0);

  const playTrack = (track: Track, playlist?: Track[]) => {
    const isSameTrack = currentTrack?.videoId === track.videoId;
    const newQueue = playlist || [track];
    const trackIndex = newQueue.findIndex(t => t.videoId === track.videoId);
    const validIndex = trackIndex !== -1 ? trackIndex : 0;
    
    queueRef.current = newQueue;
    currentIndexRef.current = validIndex;
    
    if (isSameTrack) {
      setSeekToSeconds(0);
      setProgress(0);
      setIsPlaying(true);
      setQueue(newQueue);
      setCurrentIndex(validIndex);
    } else {
      setQueue(newQueue);
      setCurrentIndex(validIndex);
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      setDuration(0);
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const playNext = () => {
    const queue = queueRef.current;
    const currentIdx = currentIndexRef.current;
    
    if (queue.length === 0) return;
    
    if (queue.length === 1) {
      setIsPlaying(false);
      setProgress(0);
      return;
    }
    
    const nextIndex = currentIdx + 1;
    
    if (nextIndex >= queue.length) {
      setIsPlaying(false);
      setProgress(0);
      return;
    }
    
    const nextTrack = queue[nextIndex];
    currentIndexRef.current = nextIndex;
    
    setCurrentIndex(nextIndex);
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
  };

  const playPrevious = () => {
    const queue = queueRef.current;
    const currentIdx = currentIndexRef.current;
    
    if (queue.length === 0) return;
    
    if (progress > 3) {
      setSeekToSeconds(0);
      setProgress(0);
      return;
    }
    
    if (queue.length === 1) {
      setSeekToSeconds(0);
      setProgress(0);
      setIsPlaying(true);
      return;
    }
    
    const prevIndex = currentIdx === 0 ? queue.length - 1 : currentIdx - 1;
    const prevTrack = queue[prevIndex];
    currentIndexRef.current = prevIndex;
    
    setCurrentIndex(prevIndex);
    setCurrentTrack(prevTrack);
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
        currentIndex,
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

