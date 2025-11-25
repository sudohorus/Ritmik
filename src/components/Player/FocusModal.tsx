import { useEffect, useState } from 'react';
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
}: FocusModalProps) {
  const [imageSrc, setImageSrc] = useState(thumbnail);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricsLine[] | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsNotFound, setLyricsNotFound] = useState(false);
  const [cachedVideoId, setCachedVideoId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const highQualityThumbnail = getHighQualityThumbnail(videoId);

  useEffect(() => {
    if (!isOpen) return;
    
    setImageSrc(thumbnail);
    
    const testImage = new Image();
    testImage.onload = () => {
      if (testImage.naturalWidth > 120 && testImage.naturalHeight > 90) {
        setImageSrc(highQualityThumbnail);
      } else {
        setImageSrc(thumbnail);
      }
    };
    testImage.onerror = () => {
      setImageSrc(thumbnail);
    };
    testImage.src = highQualityThumbnail;
  }, [isOpen, thumbnail, highQualityThumbnail]);

  useEffect(() => {
    if (videoId !== cachedVideoId) {
      setLyrics(null);
      setSyncedLyrics(null);
      setLyricsNotFound(false);
      setCachedVideoId(null);
    }
  }, [videoId]);

  useEffect(() => {
    let cancelled = false;
    
    const fetchLyrics = async () => {
      if (!title || !videoId) return;
      
      if (cachedVideoId === videoId) {
        return;
      }
      
      if (cancelled) return;
      
      setLoadingLyrics(true);
      setLyricsNotFound(false);

      try {
        const response = await fetch(
          `/api/lyrics/fetch?title=${encodeURIComponent(title)}&channel=${encodeURIComponent(artist)}`
        );
        
        if (cancelled) return;
        
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setLyrics(data.lyrics);
            setSyncedLyrics(data.syncedLyrics || null);
            setLyricsNotFound(false);
            setCachedVideoId(videoId);
          }
        } else {
          if (!cancelled) {
            setLyrics(null);
            setLyricsNotFound(true);
            setCachedVideoId(videoId);
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to fetch lyrics:', error);
        if (!cancelled) {
          setLyrics(null);
          setLyricsNotFound(true);
          setCachedVideoId(videoId);
        }
      } finally {
        if (!cancelled) {
          setLoadingLyrics(false);
        }
      }
    };

    fetchLyrics();
    
    return () => {
      cancelled = true;
    };
  }, [title, artist, videoId, cachedVideoId]);

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
        className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-zinc-950 overflow-y-auto"
        onClick={onClose}
      >
        <div className="fixed top-4 right-4 flex items-center gap-2" style={{ zIndex: 100 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddToPlaylist(true);
            }}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
            aria-label="Add to playlist"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="min-h-full flex items-center justify-center p-6 pb-24">
        <div
          className="relative w-full max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col">
              <div className="relative w-full aspect-square max-w-md mb-6">
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

              <div className="text-white text-center max-w-md">
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <p className="text-lg text-zinc-400">{artist}</p>
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

