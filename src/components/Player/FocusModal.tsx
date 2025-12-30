import { useEffect, useState, useRef } from 'react';
import SyncedLyrics from './SyncedLyrics';
import AddToPlaylistModal from '@/components/Playlist/AddToPlaylistModal';
import { LyricsLine } from '@/services/lyrics-service';
import { Track } from '@/types/track';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  thumbnail: string;
  title: string;
  artist: string;
  videoId: string;
  currentTime: number;
  onSeek: (time: number) => void;
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasQueue: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'context' | 'track';
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

const getHighQualityThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export default function FocusModal({
  isOpen,
  onClose,
  thumbnail,
  title,
  artist,
  videoId,
  currentTime,
  onSeek,
  track,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  hasQueue,
  isShuffle,
  repeatMode,
  onToggleShuffle,
  onToggleRepeat,
}: FocusModalProps) {
  const [imageSrc, setImageSrc] = useState(thumbnail);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricsLine[] | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsNotFound, setLyricsNotFound] = useState(false);
  const cachedVideoIdRef = useRef<string | null>(null);
  const cachedLyricsRef = useRef<{ lyrics: string | null; syncedLyrics: LyricsLine[] | null } | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const highQualityThumbnail = getHighQualityThumbnail(videoId);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setImageSrc(thumbnail);

    const testImage = new Image();
    testImage.onload = () => {
      if (!mountedRef.current) return;
      if (testImage.naturalWidth > 120 && testImage.naturalHeight > 90) {
        setImageSrc(highQualityThumbnail);
      } else {
        setImageSrc(thumbnail);
      }
    };
    testImage.onerror = () => {
      if (!mountedRef.current) return;
      setImageSrc(thumbnail);
    };
    testImage.src = highQualityThumbnail;
  }, [isOpen, thumbnail, highQualityThumbnail]);

  useEffect(() => {
    if (videoId !== cachedVideoIdRef.current) {
      setLyrics(null);
      setSyncedLyrics(null);
      setLyricsNotFound(false);
      cachedVideoIdRef.current = null;
      cachedLyricsRef.current = null;
    }
  }, [videoId]);

  useEffect(() => {
    if (!isOpen) {
      setLoadingLyrics(false);
      return;
    }

    if (!title || !videoId) {
      setLoadingLyrics(false);
      return;
    }

    if (cachedVideoIdRef.current === videoId && cachedLyricsRef.current) {
      setLyrics(cachedLyricsRef.current.lyrics);
      setSyncedLyrics(cachedLyricsRef.current.syncedLyrics);
      setLyricsNotFound(false);
      setLoadingLyrics(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let safetyTimeoutId: NodeJS.Timeout | null = null;

    setLoadingLyrics(true);
    setLyricsNotFound(false);

    safetyTimeoutId = setTimeout(() => {
      if (!cancelled && mountedRef.current) {
        setLoadingLyrics(false);
        setLyricsNotFound(true);
      }
      controller.abort();
    }, 8000);

    const fetchLyrics = async () => {
      try {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, 7000);

        const response = await fetch(
          `/api/lyrics/fetch?title=${encodeURIComponent(title)}&channel=${encodeURIComponent(artist)}`,
          { signal: controller.signal }
        );

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId);
          safetyTimeoutId = null;
        }

        if (cancelled || !mountedRef.current) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (!cancelled && mountedRef.current) {
            const hasLyrics = data.lyrics && data.lyrics.trim().length > 0;
            const hasSyncedLyrics = data.syncedLyrics && data.syncedLyrics.length > 0;

            if (hasLyrics || hasSyncedLyrics) {
              cachedVideoIdRef.current = videoId;
              cachedLyricsRef.current = {
                lyrics: data.lyrics,
                syncedLyrics: hasSyncedLyrics ? data.syncedLyrics : null,
              };
              setLyrics(data.lyrics);
              setSyncedLyrics(hasSyncedLyrics ? data.syncedLyrics : null);
              setLyricsNotFound(false);
            } else {
              cachedVideoIdRef.current = videoId;
              cachedLyricsRef.current = null;
              setLyrics(null);
              setSyncedLyrics(null);
              setLyricsNotFound(true);
            }
          }
        } else {
          if (!cancelled && mountedRef.current) {
            cachedVideoIdRef.current = videoId;
            cachedLyricsRef.current = null;
            setLyrics(null);
            setLyricsNotFound(true);
          }
        }
      } catch (error: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId);
          safetyTimeoutId = null;
        }

        if (error.name === 'AbortError' || cancelled) {
          return;
        }


        if (!cancelled && mountedRef.current) {
          cachedVideoIdRef.current = videoId;
          cachedLyricsRef.current = null;
          setLyrics(null);
          setLyricsNotFound(true);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId);
        }
        if (!cancelled && mountedRef.current) {
          setLoadingLyrics(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId);
      }
      controller.abort();
      setLoadingLyrics(false);
    };
  }, [isOpen, title, artist, videoId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-black/95 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div className="fixed top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddToPlaylist(true);
            }}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg backdrop-blur-sm"
            aria-label="Add to playlist"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg backdrop-blur-sm"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-screen flex items-center justify-center p-6 pb-32">
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square max-w-md mb-6">
                  <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== thumbnail) {
                        target.src = thumbnail;
                      }
                    }}
                  />
                </div>

                <div className="text-white text-center max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-2 truncate">{title}</h2>
                  <p className="text-base text-zinc-400 mb-8 truncate">{artist}</p>

                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={onToggleShuffle}
                      className={`p-3 rounded-full transition-colors ${isShuffle ? 'text-green-500 hover:bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                      title="Shuffle"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                      </svg>
                    </button>

                    <button
                      onClick={onPrevious}
                      disabled={!hasQueue}
                      className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>

                    <button
                      onClick={onTogglePlay}
                      className="p-4 bg-white hover:bg-zinc-200 rounded-full transition-all hover:scale-105"
                    >
                      {isPlaying ? (
                        <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={onNext}
                      disabled={!hasQueue}
                      className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                      </svg>
                    </button>

                    <button
                      onClick={onToggleRepeat}
                      className={`p-3 rounded-full transition-colors ${repeatMode !== 'off' ? 'text-green-500 hover:bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                      title="Repeat"
                    >
                      {repeatMode === 'track' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col min-h-[500px]">
                <h3 className="text-xl font-semibold text-white mb-4">Lyrics</h3>
                {loadingLyrics ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-zinc-400">Loading lyrics...</div>
                  </div>
                ) : syncedLyrics ? (
                  <SyncedLyrics lines={syncedLyrics} currentTime={currentTime} onSeek={onSeek} />
                ) : lyrics ? (
                  <div className="overflow-y-auto flex-1 pr-2">
                    <pre className="text-zinc-300 whitespace-pre-wrap text-base leading-relaxed font-sans">
                      {lyrics}
                    </pre>
                  </div>
                ) : lyricsNotFound ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-500 text-lg">Lyrics not available</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddToPlaylist && (
        <AddToPlaylistModal
          isOpen={showAddToPlaylist}
          onClose={() => setShowAddToPlaylist(false)}
          track={track}
        />
      )}
    </>
  );
}