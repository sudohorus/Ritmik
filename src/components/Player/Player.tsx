import { usePlayer } from '@/hooks/player/usePlayer';
import { useKeyboardShortcuts } from '@/hooks/player/useKeyboardShortcuts';
import { usePlayTracking } from '@/hooks/statistics/usePlayTracking';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import FocusModal from './FocusModal';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Player() {
  const {
    currentTrack,
    queue,
    isPlaying,
    volume,
    progress,
    duration,
    seekToSeconds,
    isShuffle,
    repeatMode,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    setProgress,
    setDuration,
    clearSeek,
  } = usePlayer();

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const router = useRouter();
  const currentRouteRef = useRef(router.pathname);
  const mountedRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const { recordSkip } = usePlayTracking(currentTrack, progress, duration, isPlaying);

  const handleSeekForward = () => {
    if (playerRef.current?.seekTo && duration > 0) {
      const newTime = Math.min(progress + 5, duration);
      playerRef.current.seekTo(newTime, true);
      setProgress(newTime);
    }
  };

  const handleSeekBackward = () => {
    if (playerRef.current?.seekTo) {
      const newTime = Math.max(progress - 5, 0);
      playerRef.current.seekTo(newTime, true);
      setProgress(newTime);
    }
  };

  const handleVolumeUp = () => {
    setVolume(Math.min(volume + 0.1, 1));
  };

  const handleVolumeDown = () => {
    setVolume(Math.max(volume - 0.1, 0));
  };

  const handlePlayNext = () => {
    recordSkip();
    playNext(false);
  };

  const handlePlayPrevious = () => {
    recordSkip();
    playPrevious();
  };

  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onNext: handlePlayNext,
    onPrevious: handlePlayPrevious,
    onSeekForward: handleSeekForward,
    onSeekBackward: handleSeekBackward,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
  });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (playerRef.current) {
        try {
          if (typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo();
          }
        } catch (err) {
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!currentTrack || !mountedRef.current) return;

    setProgress(0);

    const loadYouTubeAPI = () => {
      if (window.YT) {
        initPlayer();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initPlayer;
    };

    const initPlayer = () => {
      if (!mountedRef.current) return;

      const initialVolumePercent = Math.round(volume * 100);

      if (playerRef.current && playerRef.current.loadVideoById) {
        try {
          setProgress(0);
          setDuration(0);

          playerRef.current.loadVideoById({
            videoId: currentTrack.videoId,
            startSeconds: 0,
          });

          if (playerRef.current.setVolume) {
            playerRef.current.setVolume(initialVolumePercent);
          }

          if (isPlayingRef.current) {
            playerRef.current.playVideo();
          }

          setTimeout(() => {
            if (mountedRef.current && playerRef.current?.getDuration) {
              try {
                const dur = playerRef.current.getDuration();
                if (dur > 0) {
                  setDuration(dur);
                }
              } catch (err) {
                console.error('Error getting duration:', err);
              }
            }
          }, 1000);
        } catch (err) {
          console.error('Error loading video:', err);
        }

        return;
      }

      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: currentTrack.videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!mountedRef.current) return;

              try {
                const initialVol = Math.round(volume * 100);
                if (event.target && typeof event.target.setVolume === 'function') {
                  event.target.setVolume(initialVol);
                }
                const dur = event.target.getDuration();
                if (dur > 0) {
                  setDuration(dur);
                }

                if (isPlayingRef.current) {
                  event.target.playVideo();
                }
              } catch (err) {
                console.error('Error in onReady:', err);
              }
            },
            onStateChange: (event: any) => {
              if (!mountedRef.current) return;

              try {
                if ((event.data === window.YT.PlayerState.CUED || event.data === -1) && isPlayingRef.current) {
                  event.target.playVideo();
                }

                if (event.data === window.YT.PlayerState.ENDED) {
                  playNext(true);
                }
              } catch (err) {
                console.error('Error in onStateChange:', err);
              }
            },
          },
        });
      } catch (err) {
        console.error('Error creating player:', err);
      }
    };

    loadYouTubeAPI();
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!currentTrack || !mountedRef.current) return;

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (typeof currentTime === 'number' && !isNaN(currentTime) && currentTime >= 0) {
            setProgress(currentTime);
          }
        } catch (err) {
          console.error('Error getting current time:', err);
        }
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack]);

  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      const vol = Math.round(volume * 100);
      playerRef.current.setVolume(vol);
    }
  }, [volume]);

  useEffect(() => {
    if (seekToSeconds !== null && playerRef.current?.seekTo) {
      playerRef.current.seekTo(seekToSeconds, true);
      setProgress(seekToSeconds);
      clearSeek();
    }
  }, [seekToSeconds]);

  const handleSeek = (seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setProgress(seconds);
    }
  };

  const handleLyricsSeek = (time: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(time, true);
      setProgress(time);
    }
  };

  if (!currentTrack) return null;

  return (
    <>
      <div id="youtube-player" className="hidden" />

      {!isFocusModalOpen && (
        <div className="md:hidden fixed left-0 right-0 bg-zinc-900 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}>
          <div className="w-full px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded object-cover cursor-pointer"
                  onClick={() => setIsFocusModalOpen(!isFocusModalOpen)}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {currentTrack.artist}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={togglePlay}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handlePlayNext}
                  disabled={queue.length === 0}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div key={currentTrack.videoId} className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
              {duration > 0 && (
                <div
                  className="h-full bg-white transition-none"
                  style={{ width: `${(progress / duration) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="w-full px-4 py-3">
          <div className="grid grid-cols-[1fr_2fr_1fr] items-center gap-4 max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative group shrink-0">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-14 h-14 rounded object-cover cursor-pointer transition-opacity group-hover:opacity-70"
                  onClick={() => setIsFocusModalOpen(!isFocusModalOpen)}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <svg
                    className="w-6 h-6 text-white drop-shadow-lg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {currentTrack.artist}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 min-w-0">
              <PlayerControls
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onNext={handlePlayNext}
                onPrevious={handlePlayPrevious}
                hasQueue={queue.length > 0}
                isShuffle={isShuffle}
                repeatMode={repeatMode}
                onToggleShuffle={toggleShuffle}
                onToggleRepeat={toggleRepeat}
              />
              <div className="w-full max-w-2xl">
                <ProgressBar
                  progress={progress}
                  duration={duration}
                  onSeek={handleSeek}
                />
              </div>
            </div>

            <div className="flex justify-end pr-4">
              <VolumeControl volume={volume} onVolumeChange={setVolume} />
            </div>
          </div>
        </div>
      </div>

      <FocusModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        thumbnail={currentTrack.thumbnail}
        title={currentTrack.title}
        artist={currentTrack.artist}
        videoId={currentTrack.videoId}
        currentTime={progress}
        onSeek={handleLyricsSeek}
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={handlePlayNext}
        onPrevious={handlePlayPrevious}
        hasQueue={queue.length > 0}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
      />
    </>
  );
}