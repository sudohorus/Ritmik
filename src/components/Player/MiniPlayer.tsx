import { usePlayer } from '@/hooks/player/usePlayer';
import { usePlayerMode } from '@/contexts/PlayerModeContext';
import { formatDuration } from '@/utils/format';
import { useState, useEffect, useRef } from 'react';

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    queue,
    togglePlay,
    playNext,
    playPrevious,
    seekTo
  } = usePlayer();

  const { setMode } = usePlayerMode();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 420 });
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const progressRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .no-drag')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    seekTo(newTime);
  };

  return (
    <div
      className="fixed w-[300px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Header - Area de arrastar */}
      <div
        className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/95 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-400">Now Playing</span>
        </div>
        <button
          onClick={() => setMode('normal')}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors no-drag"
          title="Expandir"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Album Art */}
      <div className="relative">
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-full aspect-square object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
      </div>

      {/* Info & Controls */}
      <div className="p-4 space-y-3">
        {/* Track Info */}
        <div className="min-h-[44px]">
          <h3 className="text-sm font-semibold text-white truncate leading-tight mb-1">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 no-drag">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-1 bg-zinc-800 rounded-full relative overflow-hidden cursor-pointer group"
          >
            <div
              className="absolute h-full bg-white rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums">
            <span>{formatDuration(Math.floor(progress))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 no-drag pt-1">
          <button
            onClick={playPrevious}
            disabled={queue.length === 0}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Anterior"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white text-zinc-900 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => playNext()}
            disabled={queue.length === 0}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Próxima"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Queue info */}
        {queue.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 pt-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>{queue.length} na fila</span>
          </div>
        )}
      </div>
    </div>
  );
}