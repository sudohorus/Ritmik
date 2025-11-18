interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasQueue: boolean;
}

export default function PlayerControls({
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  hasQueue,
}: PlayerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrevious}
        disabled={!hasQueue}
        className="text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 transition-colors"
        title="Previous"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
        </svg>
      </button>

      <button
        onClick={onTogglePlay}
        className="w-10 h-10 flex items-center justify-center bg-white text-zinc-900 rounded-full hover:scale-105 transition-transform shadow-lg"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        onClick={onNext}
        disabled={!hasQueue}
        className="text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 transition-colors"
        title="Next"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
        </svg>
      </button>
    </div>
  );
}

