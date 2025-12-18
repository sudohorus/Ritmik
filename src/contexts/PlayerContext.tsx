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
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playFromQueue: (index: number) => void;
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
        const otherTracks = originalQueueRef.current.filter(t => t.videoId !== currentTrack?.videoId);
        const shuffledOthers = shuffleArray(otherTracks);
        const shuffled = currentTrack ? [currentTrack, ...shuffledOthers] : shuffledOthers;

        queueRef.current = shuffled;
        currentIndexRef.current = 0;
        setQueue(shuffled);
        setCurrentIndex(0);
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
      window.localStorage.setItem('ritmik_player_volume', String(clamped));
    }
  };

  const seekTo = (seconds: number) => {
    setSeekToSeconds(seconds);
  };

  const clearSeek = () => {
    setSeekToSeconds(null);
  };

  const addToQueue = (track: Track) => {
    const newOriginalQueue = [...originalQueueRef.current, track];
    const newQueue = isShuffleRef.current
      ? [...queueRef.current, track]
      : newOriginalQueue;

    queueRef.current = newQueue;
    originalQueueRef.current = newOriginalQueue;

    setQueue(newQueue);
    setOriginalQueue(newOriginalQueue);
  };

  const removeFromQueue = (index: number) => {
    if (index < 0 || index >= queueRef.current.length) return;

    const trackToRemove = queueRef.current[index];
    const currentIdx = currentIndexRef.current;

    const newQueue = queueRef.current.filter((_, i) => i !== index);

    const newOriginalQueue = originalQueueRef.current.filter(
      t => t.videoId !== trackToRemove.videoId ||
        originalQueueRef.current.indexOf(t) !== originalQueueRef.current.findIndex(track => track.videoId === trackToRemove.videoId)
    );

    let newIndex = currentIdx;
    if (index < currentIdx) {
      newIndex = currentIdx - 1;
    } else if (index === currentIdx) {
      newIndex = Math.min(currentIdx, newQueue.length - 1);
    }

    queueRef.current = newQueue;
    originalQueueRef.current = newOriginalQueue;
    currentIndexRef.current = newIndex;

    setQueue(newQueue);
    setOriginalQueue(newOriginalQueue);
    setCurrentIndex(newIndex);

    if (index === currentIdx && newQueue.length > 0) {
      setCurrentTrack(newQueue[newIndex]);
      setIsPlaying(true);
      setProgress(0);
      setDuration(0);
    } else if (newQueue.length === 0) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= queueRef.current.length) return;
    if (toIndex < 0 || toIndex >= queueRef.current.length) return;

    const newQueue = [...queueRef.current];
    const [movedTrack] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedTrack);

    const currentIdx = currentIndexRef.current;
    let newIndex = currentIdx;

    if (fromIndex === currentIdx) {
      newIndex = toIndex;
    } else if (fromIndex < currentIdx && toIndex >= currentIdx) {
      newIndex = currentIdx - 1;
    } else if (fromIndex > currentIdx && toIndex <= currentIdx) {
      newIndex = currentIdx + 1;
    }

    queueRef.current = newQueue;
    currentIndexRef.current = newIndex;

    setQueue(newQueue);
    setCurrentIndex(newIndex);

    if (!isShuffleRef.current) {
      originalQueueRef.current = newQueue;
      setOriginalQueue(newQueue);
    }
  };

  const clearQueue = () => {
    queueRef.current = [];
    originalQueueRef.current = [];
    currentIndexRef.current = 0;

    setQueue([]);
    setOriginalQueue([]);
    setCurrentIndex(0);
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  };

  const playFromQueue = (index: number) => {
    if (index < 0 || index >= queueRef.current.length) return;

    const track = queueRef.current[index];
    currentIndexRef.current = index;

    setCurrentIndex(index);
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
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
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        playFromQueue,
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