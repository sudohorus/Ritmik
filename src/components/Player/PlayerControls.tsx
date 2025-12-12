interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasQueue: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'context' | 'track';
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export default function PlayerControls({
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  hasQueue,
  isShuffle,
  repeatMode,
  onToggleShuffle,
  onToggleRepeat,
}: PlayerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onToggleShuffle}
        className={`transition-colors ${isShuffle ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-white'}`}
        title="Shuffle"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>

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

      <button
        onClick={onToggleRepeat}
        className={`transition-colors ${repeatMode !== 'off' ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-white'}`}
        title="Repeat"
      >
        {repeatMode === 'track' ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        )}
      </button>
    </div>
  );
}

