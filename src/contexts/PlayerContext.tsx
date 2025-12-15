import React, { createContext, ReactNode, useState, useRef, useEffect } from 'react';
import { Track } from '@/types/track';
import { useAuth } from './AuthContext';
import { UserActivityService } from '@/services/user-activity-service';

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  seekToSeconds: number | null;
  isShuffle: boolean;
  repeatMode: 'off' | 'context' | 'track';
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  playNext: (auto?: boolean) => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
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
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'context' | 'track'>('off');

  const queueRef = useRef<Track[]>([]);
  const originalQueueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isShuffleRef = useRef(false);
  const repeatModeRef = useRef<'off' | 'context' | 'track'>('off');

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem('ritmik_player_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!Number.isNaN(parsed)) {
          const clamped = Math.max(0, Math.min(1, parsed));
          setVolumeState(clamped);
        }
      }
    } catch {
    }
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (isPlaying) {
        UserActivityService.updateActivity(user.id, currentTrack);
      } else {
        UserActivityService.updateActivity(user.id, null);
      }
    }
  }, [currentTrack, isPlaying, user]);

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const playTrack = (track: Track, playlist?: Track[]) => {
    const isSameTrack = currentTrack?.videoId === track.videoId;
    const newOriginalQueue = playlist || [track];

    let newQueue = newOriginalQueue;
    if (isShuffleRef.current) {
      newQueue = shuffleArray(newOriginalQueue);
      const idx = newQueue.findIndex(t => t.videoId === track.videoId);
    }

    const trackIndex = newQueue.findIndex(t => t.videoId === track.videoId);
    const validIndex = trackIndex !== -1 ? trackIndex : 0;

    queueRef.current = newQueue;
    originalQueueRef.current = newOriginalQueue;
    currentIndexRef.current = validIndex;

    setOriginalQueue(newOriginalQueue);
    setQueue(newQueue);
    setCurrentIndex(validIndex);

    if (isSameTrack) {
      setSeekToSeconds(0);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      setDuration(0);
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => {
      const nextShuffle = !prev;
      const currentTrack = queueRef.current[currentIndexRef.current];

      if (nextShuffle) {
        const shuffled = shuffleArray(originalQueueRef.current);
        let newIndex = shuffled.findIndex(t => t.videoId === currentTrack?.videoId);
        if (newIndex === -1) newIndex = 0;

        queueRef.current = shuffled;
        currentIndexRef.current = newIndex;
        setQueue(shuffled);
        setCurrentIndex(newIndex);
      } else {
        const original = originalQueueRef.current;

        let newIndex = original.findIndex(t => t.videoId === currentTrack?.videoId);
        if (newIndex === -1) newIndex = 0;

        queueRef.current = original;
        currentIndexRef.current = newIndex;
        setQueue(original);
        setCurrentIndex(newIndex);
      }

      return nextShuffle;
    });
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'context';
      if (prev === 'context') return 'track';
      return 'off';
    });
  };

  const playNext = (auto = false) => {
    const queue = queueRef.current;
    const currentIdx = currentIndexRef.current;

    if (queue.length === 0) return;

    if (auto && repeatModeRef.current === 'track') {
      setSeekToSeconds(0);
      setProgress(0);
      setIsPlaying(true);
      return;
    }

    if (queue.length === 1) {
      if (repeatModeRef.current !== 'off') {
        setSeekToSeconds(0);
        setProgress(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
      return;
    }

    let nextIndex = currentIdx + 1;

    if (nextIndex >= queue.length) {
      if (repeatModeRef.current === 'context') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        setProgress(0);
        return;
      }
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

    let prevIndex = currentIdx - 1;

    if (prevIndex < 0) {
      if (repeatModeRef.current === 'context') {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    const prevTrack = queue[prevIndex];
    currentIndexRef.current = prevIndex;

    setCurrentIndex(prevIndex);
    setCurrentTrack(prevTrack);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
  };

  const setVolume = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('ritmik_player_volume', String(clamped));
      } catch {

      }
    }
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
        isShuffle,
        repeatMode,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
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