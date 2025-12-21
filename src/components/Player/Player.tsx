import { usePlayer } from '@/hooks/player/usePlayer';
import { useKeyboardShortcuts } from '@/hooks/player/useKeyboardShortcuts';
import { usePlayTracking } from '@/hooks/statistics/usePlayTracking';
import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import FocusModal from './FocusModal';
import QueueView from './QueueView';
import { useJam } from '@/contexts/JamContext';
import { CreateJamModal } from '../Jam/CreateJamModal';
import { JoinJamModal } from '../Jam/JoinJamModal';
import { JamView } from '../Jam/JamView';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MemoizedPlayerControls = memo(PlayerControls);
const MemoizedProgressBar = memo(ProgressBar);
const MemoizedVolumeControl = memo(VolumeControl);
const MemoizedQueueView = memo(QueueView);
const MemoizedJamView = memo(JamView);
const MemoizedFocusModal = memo(FocusModal);

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
    playTrack,
  } = usePlayer();

  const { currentJam, isHost, isInJam, updateJamState, timeOffset } = useJam();
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [showCreateJam, setShowCreateJam] = useState(false);
  const [showJoinJam, setShowJoinJam] = useState(false);
  const [showJamMenu, setShowJamMenu] = useState(false);
  const router = useRouter();
  const currentRouteRef = useRef(router.pathname);
  const mountedRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);
  const durationSetRef = useRef(false);
  const lastProgressUpdateRef = useRef(0);

  const prevJamTrackIdRef = useRef<string | null>(null);
  const trackJustChangedRef = useRef(false);
  const trackChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const prevJamIsPlaying = useRef(currentJam?.is_playing);

  useEffect(() => {
    if (!isInJam || isHost || !currentJam) return;

    if (currentJam.current_track_id !== prevJamTrackIdRef.current) {
      prevJamTrackIdRef.current = currentJam.current_track_id;
      trackJustChangedRef.current = true;

      if (trackChangeTimeoutRef.current) {
        clearTimeout(trackChangeTimeoutRef.current);
      }
      trackChangeTimeoutRef.current = setTimeout(() => {
        trackJustChangedRef.current = false;
      }, 2000);
    }

    if (currentJam.current_track_id && currentJam.current_track_id !== currentTrack?.videoId) {
      let track = queue.find(t => t.videoId === currentJam.current_track_id);
      if (!track && currentJam.queue) {
        const jamQueue = currentJam.queue as any[];
        track = jamQueue.find(t => t.videoId === currentJam.current_track_id);
        if (track) playTrack(track, jamQueue);
      } else if (track) {
        playTrack(track, queue);
      }
      return;
    }

    if (currentJam.is_playing !== prevJamIsPlaying.current) {
      if (currentJam.is_playing) {
        playerRef.current?.playVideo();
      } else {
        playerRef.current?.pauseVideo();
      }
      prevJamIsPlaying.current = currentJam.is_playing;
    }

    if (currentJam.current_position !== undefined && !trackJustChangedRef.current) {
      let targetPosition = currentJam.current_position;

      if (currentJam.is_playing && currentJam.updated_at) {
        let updateTimeStr = currentJam.updated_at;
        if (!updateTimeStr.endsWith('Z') && !updateTimeStr.includes('+')) {
          updateTimeStr += 'Z';
        }
        const lastUpdate = new Date(updateTimeStr).getTime();
        const now = Date.now() + (timeOffset || 0);
        const elapsed = Math.max(0, (now - lastUpdate) / 1000);
        targetPosition += elapsed;
      }

      if (duration > 0 && targetPosition >= 0 && targetPosition <= duration) {
        const currentProgress = playerRef.current?.getCurrentTime?.() || 0;
        const diff = Math.abs(targetPosition - currentProgress);

        const shouldSync = diff > 5 || (diff > 3 && !isPlaying);

        if (shouldSync) {
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            try {
              playerRef.current.seekTo(targetPosition, true);
              setProgress(targetPosition);
            } catch { }
          }
        }
      }
    }
  }, [currentJam, isInJam, isHost, currentTrack, queue, playTrack, setProgress, duration]);

  useEffect(() => {
    return () => {
      if (trackChangeTimeoutRef.current) {
        clearTimeout(trackChangeTimeoutRef.current);
      }
    };
  }, []);

  const { recordSkip } = usePlayTracking(currentTrack, progress, duration, isPlaying);

  const handleSeekForward = () => {
    if (isInJam && !isHost) return;
    if (playerRef.current && typeof playerRef.current.seekTo === 'function' && duration > 0) {
      const newTime = Math.min(progress + 5, duration);
      try {
        playerRef.current.seekTo(newTime, true);
        setProgress(newTime);
      } catch (e) { }
    }
  };

  const handleSeekBackward = () => {
    if (isInJam && !isHost) return;
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const newTime = Math.max(progress - 5, 0);
      try {
        playerRef.current.seekTo(newTime, true);
        setProgress(newTime);
      } catch (e) { }
    }
  };

  const handleVolumeUp = () => {
    setVolume(Math.min(volume + 0.1, 1));
  };

  const handleVolumeDown = () => {
    setVolume(Math.max(volume - 0.1, 0));
  };

  const handleTogglePlay = () => {
    if (isInJam && !isHost) {
      togglePlay();

      if (!isPlaying && currentJam?.is_playing) {
        let targetPosition = currentJam.current_position || 0;
        if (currentJam.updated_at) {
          let updateTimeStr = currentJam.updated_at;
          if (!updateTimeStr.endsWith('Z') && !updateTimeStr.includes('+')) updateTimeStr += 'Z';
          if (!updateTimeStr.endsWith('Z') && !updateTimeStr.includes('+')) updateTimeStr += 'Z';
          const now = Date.now() + (timeOffset || 0);
          const elapsed = Math.max(0, (now - new Date(updateTimeStr).getTime()) / 1000);
          targetPosition += elapsed;
        }

        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          try {
            playerRef.current.seekTo(targetPosition, true);
            setProgress(targetPosition);
          } catch (e) { }
        }
      }
      return;
    }

    togglePlay();
    if (isInJam && isHost && currentJam) {
      updateJamState({
        isPlaying: !isPlaying,
        position: progress,
      });
    }
  };

  const handlePlayNext = () => {
    if (isInJam && !isHost) return;
    recordSkip();
    playNext(false);
  };

  const handlePlayPrevious = () => {
    if (isInJam && !isHost) return;
    recordSkip();
    playPrevious();
  };

  useKeyboardShortcuts({
    onPlayPause: handleTogglePlay,
    onNext: handlePlayNext,
    onPrevious: handlePlayPrevious,
    onSeekForward: handleSeekForward,
    onSeekBackward: handleSeekBackward,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (durationCheckIntervalRef.current) {
        clearInterval(durationCheckIntervalRef.current);
        durationCheckIntervalRef.current = null;
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

  const tryGetDuration = () => {
    if (!mountedRef.current || !playerRef.current || durationSetRef.current) return true;

    try {
      if (typeof playerRef.current.getDuration === 'function') {
        const dur = playerRef.current.getDuration();
        if (dur > 0 && dur !== Infinity) {
          setDuration(dur);
          durationSetRef.current = true;

          if (durationCheckIntervalRef.current) {
            clearInterval(durationCheckIntervalRef.current);
            durationCheckIntervalRef.current = null;
          }

          return true;
        }
      }
    } catch (err) {
      console.warn('Error getting duration:', err);
    }

    return false;
  };

  useEffect(() => {
    if (!currentTrack || !mountedRef.current) return;

    setProgress(0);
    durationSetRef.current = false;

    trackJustChangedRef.current = true;
    if (trackChangeTimeoutRef.current) {
      clearTimeout(trackChangeTimeoutRef.current);
    }
    trackChangeTimeoutRef.current = setTimeout(() => {
      trackJustChangedRef.current = false;
    }, 2000);

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      window.onYouTubeIframeAPIReady = initPlayer;
    };

    const initPlayer = () => {
      if (!mountedRef.current) return;

      const initialVolumePercent = Math.round(volume * 100);

      if (playerRef.current && playerRef.current.loadVideoById) {
        try {
          setProgress(0);
          setDuration(0);

          if (isPlayingRef.current) {
            playerRef.current.loadVideoById({
              videoId: currentTrack.videoId,
              startSeconds: 0,
            });
          } else {
            playerRef.current.cueVideoById({
              videoId: currentTrack.videoId,
              startSeconds: 0,
            });
          }

          if (playerRef.current.setVolume) {
            playerRef.current.setVolume(initialVolumePercent);
          }

          if (isPlayingRef.current) {
            setTimeout(() => {
              if (playerRef.current && mountedRef.current) {
                playerRef.current.playVideo();
              }
            }, 100);
          }

          const attemptGetDuration = () => {
            if (tryGetDuration()) return;

            setTimeout(() => tryGetDuration(), 500);
            setTimeout(() => tryGetDuration(), 1000);
            setTimeout(() => tryGetDuration(), 2000);

            if (durationCheckIntervalRef.current) {
              clearInterval(durationCheckIntervalRef.current);
            }

            durationCheckIntervalRef.current = setInterval(() => {
              tryGetDuration();
            }, 1000);
          };

          attemptGetDuration();

        } catch (err) {
          console.error('Error loading video:', err);
        }

        return;
      }

      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: currentTrack.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (!mountedRef.current) return;

              try {
                const initialVol = Math.round(volume * 100);
                if (event.target && typeof event.target.setVolume === 'function') {
                  event.target.setVolume(initialVol);
                }

                if (!tryGetDuration()) {
                  setTimeout(() => tryGetDuration(), 300);
                  setTimeout(() => tryGetDuration(), 700);
                  setTimeout(() => tryGetDuration(), 1500);

                  if (durationCheckIntervalRef.current) {
                    clearInterval(durationCheckIntervalRef.current);
                  }

                  durationCheckIntervalRef.current = setInterval(() => {
                    tryGetDuration();
                  }, 1000);
                }

                if (isPlayingRef.current) {
                  setTimeout(() => {
                    if (mountedRef.current && event.target) {
                      event.target.playVideo();
                    }
                  }, 100);
                }
              } catch (err) {
                console.error('Error in onReady:', err);
              }
            },
            onStateChange: (event: any) => {
              if (!mountedRef.current) return;

              try {
                if (event.data === window.YT.PlayerState.PLAYING ||
                  event.data === window.YT.PlayerState.BUFFERING) {
                  tryGetDuration();
                }

                if ((event.data === window.YT.PlayerState.CUED || event.data === -1) && isPlayingRef.current) {
                  if (event.target && typeof event.target.playVideo === 'function') {
                    event.target.playVideo();
                  }
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
      } catch { }
    };

    loadYouTubeAPI();

    return () => {
      if (durationCheckIntervalRef.current) {
        clearInterval(durationCheckIntervalRef.current);
        durationCheckIntervalRef.current = null;
      }
    };
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!currentTrack || !mountedRef.current) return;

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (typeof currentTime === 'number' && !isNaN(currentTime) && currentTime >= 0) {
            const timeDiff = Math.abs(currentTime - lastProgressUpdateRef.current);
            if (timeDiff >= 0.3) {
              setProgress(currentTime);
              lastProgressUpdateRef.current = currentTime;
            }

            if (!durationSetRef.current && (duration === 0 || duration === Infinity)) {
              tryGetDuration();
            }
          }
        } catch (err) {
          console.error('Error getting current time:', err);
        }
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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

  useEffect(() => {
    if (!isInJam || !isHost || !currentJam || !currentTrack) return;

    const trackChanged = currentJam.current_track_id !== currentTrack.videoId;

    let queueChanged = false;
    if (currentJam.queue && queue) {
      if (currentJam.queue.length !== queue.length) {
        queueChanged = true;
      } else if (queue.length > 0) {
        const jamQueue = currentJam.queue as any[];
        if (jamQueue[0]?.videoId !== queue[0]?.videoId ||
          jamQueue[jamQueue.length - 1]?.videoId !== queue[queue.length - 1]?.videoId) {
          queueChanged = true;
        }
      }
    } else if ((currentJam.queue && !queue) || (!currentJam.queue && queue)) {
      queueChanged = true;
    }

    if (trackChanged || queueChanged) {
      updateJamState({
        currentTrack: currentTrack,
        isPlaying: isPlaying,
        position: trackChanged ? 0 : progress,
        queue: queue
      });
    }
  }, [currentTrack, queue, isInJam, isHost, currentJam?.current_track_id, currentJam?.queue?.length]);

  const handleSeek = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const currentPos = playerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(seconds - currentPos) < 0.5) return;

      try {
        playerRef.current.seekTo(seconds, true);
        setProgress(seconds);
        lastProgressUpdateRef.current = seconds;

        if (isInJam && isHost) {
          updateJamState({ position: seconds });
        }
      } catch { }
    }
  }, [isInJam, isHost, updateJamState, setProgress]);

  const handleLyricsSeek = useCallback((time: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const currentPos = playerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(time - currentPos) < 0.5) return;

      try {
        playerRef.current.seekTo(time, true);
        setProgress(time);
        lastProgressUpdateRef.current = time;

        if (isInJam && isHost) {
          updateJamState({ position: time });
        }
      } catch (err) {
        console.warn('Error seeking lyrics:', err);
      }
    }
  }, [isInJam, isHost, updateJamState, setProgress]);



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
              <MemoizedPlayerControls
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onNext={handlePlayNext}
                onPrevious={handlePlayPrevious}
                hasQueue={queue.length > 0}
                isShuffle={isShuffle}
                repeatMode={repeatMode}
                onToggleShuffle={toggleShuffle}
                onToggleRepeat={toggleRepeat}
              />
              <div className="w-full max-w-2xl">
                <MemoizedProgressBar
                  progress={progress}
                  duration={duration}
                  onSeek={handleSeek}
                />
              </div>
            </div>

            <div className="flex justify-end pr-4 items-center gap-4">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isInJam) {
                      setShowJamMenu(!showJamMenu);
                    } else {
                      setShowJamMenu(true);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all duration-300 ${isInJam
                    ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  title={isInJam ? "Toggle Jam View" : "Start Jam Session"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </button>

                <button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  className={`p-2 rounded-lg transition-colors ${isQueueOpen ? 'text-green-500 bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  title="Queue"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="absolute bottom-full right-0 mb-4 z-50 flex flex-col gap-2 items-end">
                  {isInJam && showJamMenu && <MemoizedJamView />}
                  <MemoizedQueueView isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
                </div>
              </div>
              <MemoizedVolumeControl volume={volume} onVolumeChange={setVolume} />
            </div>
          </div>
        </div>
      </div>

      <MemoizedFocusModal
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
        onTogglePlay={handleTogglePlay}
        onNext={handlePlayNext}
        onPrevious={handlePlayPrevious}
        hasQueue={queue.length > 0}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
      />

      <CreateJamModal isOpen={showCreateJam} onClose={() => setShowCreateJam(false)} />
      <JoinJamModal isOpen={showJoinJam} onClose={() => setShowJoinJam(false)} />

      {showJamMenu && !isInJam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowJamMenu(false)}>
          <div className="bg-zinc-900 rounded-xl max-w-sm w-full p-6 border border-zinc-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-white">Jam Session</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowJamMenu(false);
                  setShowCreateJam(true);
                }}
                className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">Create Jam</div>
                  <div className="text-xs text-zinc-400">Start a new listening session</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowJamMenu(false);
                  setShowJoinJam(true);
                }}
                className="w-full flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a6 6 0 00-9-5.197M9 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v2h9" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">Join Jam</div>
                  <div className="text-xs text-zinc-400">Enter a code to join friends</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowJamMenu(false)}
              className="mt-4 w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}