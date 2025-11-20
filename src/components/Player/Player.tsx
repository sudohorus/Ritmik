import { usePlayer } from '@/hooks/usePlayer';
import { useEffect, useRef } from 'react';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';

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
    togglePlay,
    playNext,
    playPrevious,
    setVolume,
    setProgress,
    setDuration,
    seekTo,
  } = usePlayer();

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentTrack) return;

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
      if (playerRef.current && playerRef.current.loadVideoById) {
        setProgress(0);
        setDuration(0);
        
        playerRef.current.loadVideoById({
          videoId: currentTrack.videoId,
          startSeconds: 0,
        });
        
        playerRef.current.setVolume(100);
        
        setTimeout(() => {
          if (playerRef.current && playerRef.current.getDuration) {
            const dur = playerRef.current.getDuration();
            if (dur > 0) {
              setDuration(dur);
            }
          }
        }, 1000);
        
        return;
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: currentTrack.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(100);
            const dur = event.target.getDuration();
            if (dur > 0) {
              setDuration(dur);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              playNext();
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              event.target.setVolume(100);
            }
          },
        },
      });
    };

    loadYouTubeAPI();
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime >= 0) {
          setProgress(currentTime);
        }
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack?.videoId]);

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

  const handleSeek = (seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setProgress(seconds);
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
      <div id="youtube-player" className="hidden" />

      <div className="w-full px-4 py-3">
        <div className="grid grid-cols-[1fr_2fr_1fr] items-center gap-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-14 h-14 rounded object-cover shrink-0"
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

          <div className="flex flex-col items-center gap-2 min-w-0">
            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onPrevious={playPrevious}
              onNext={playNext}
              hasQueue={queue.length > 0}
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
  );
}

