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
            cachedVideoIdRef.current = videoId;
            cachedLyricsRef.current = {
              lyrics: data.lyrics,
              syncedLyrics: data.syncedLyrics || null,
            };
            setLyrics(data.lyrics);
            setSyncedLyrics(data.syncedLyrics || null);
            setLyricsNotFound(false);
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
        className="fixed top-0 left-0 right-0 bottom-0 z-60 bg-zinc-950 overflow-y-auto"
        onClick={onClose}
      >
        <div className="fixed top-2 right-2 md:top-4 md:right-4 flex items-center gap-1 md:gap-2" style={{ zIndex: 100 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddToPlaylist(true);
            }}
            className="text-zinc-400 hover:text-white transition-colors p-1.5 md:p-2 hover:bg-zinc-800 rounded-lg"
            aria-label="Add to playlist"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-full flex items-center justify-center p-4 md:p-6 pb-24 md:pb-32">
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square max-w-sm mb-3 md:mb-4">
                  <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== thumbnail) {
                        target.src = thumbnail;
                      }
                    }}
                  />
                </div>

                <div className="text-white text-center max-w-sm">
                  <h2 className="text-lg md:text-xl font-bold mb-1">{title}</h2>
                  <p className="text-sm md:text-base text-zinc-400 mb-4">{artist}</p>

                  <div className="flex items-center justify-center gap-4 md:gap-6">
                    <button
                      onClick={onPrevious}
                      disabled={!hasQueue}
                      className="p-2 md:p-3 hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>

                    <button
                      onClick={onTogglePlay}
                      className="p-3 md:p-4 bg-white hover:bg-zinc-200 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <svg className="w-6 h-6 md:w-7 md:h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 md:w-7 md:h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={onNext}
                      disabled={!hasQueue}
                      className="p-2 md:p-3 hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                {loadingLyrics ? (
                  <div className="overflow-y-auto min-h-[400px] max-h-[600px] px-4 py-4">
                    <div className="text-zinc-400 w-full text-center py-8">Loading lyrics...</div>
                  </div>
                ) : syncedLyrics ? (
                  <SyncedLyrics lines={syncedLyrics} currentTime={currentTime} onSeek={onSeek} />
                ) : lyrics ? (
                  <div className="overflow-y-auto min-h-[400px] max-h-[600px] px-4 py-4">
                    <pre className="text-zinc-300 whitespace-pre-wrap text-base leading-loose font-sans w-full">
                      {lyrics}
                    </pre>
                  </div>
                ) : lyricsNotFound ? (
                  <div className="overflow-y-auto min-h-[400px] max-h-[600px] px-4 py-4">
                    <p className="text-zinc-500 text-lg italic w-full text-center py-8">
                      Lyrics not available
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        track={track}
      />
    </>
  );
}