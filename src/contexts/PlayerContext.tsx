import { createContext, ReactNode, useState } from 'react';
import { Track } from '@/types/track';

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  seekTo: (seconds: number) => void;
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
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
    setQueue(playlist || [track]);
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
    setTimeout(() => setSeekToSeconds(null), 100);
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
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        setVolume,
        setProgress,
        setDuration,
        seekTo: seekToSeconds !== null ? () => seekToSeconds : seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

