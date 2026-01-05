import { useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlaylistTrack } from '@/types/playlist';
import TrackOptionsMenu from './TrackOptionsMenu';

interface SortableTrackItemProps {
  track: PlaylistTrack;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isOwner: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDoubleClick?: () => void;
  disabled?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onLongPress?: () => void;
  addedByUser?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function SortableTrackItem({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  isOwner,
  onPlay,
  onRemove,
  onDoubleClick,
  disabled = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  onLongPress,
  addedByUser,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.video_id, disabled: !isOwner || disabled || isSelectionMode });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const longPressTriggeredRef = useRef(false);

  const startLongPress = useCallback(() => {
    if (isSelectionMode || !onLongPress) return;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, 500);
  }, [isSelectionMode, onLongPress]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isSelectionMode && onToggleSelection) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection();
    } else {
      onPlay();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-900 border rounded-lg p-2 md:p-4 transition-all group cursor-pointer ${isSelected
        ? 'border-blue-500 bg-blue-500/10'
        : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
        }`}
      onClick={handleClick}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
    >
      <div className="flex items-center gap-2 md:gap-4">
        {isSelectionMode ? (
          <div className="shrink-0 flex items-center justify-center w-6 h-6">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-zinc-600 bg-transparent'
              }`}>
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        ) : (
          <>
            {isOwner && !disabled && (
              <button
                {...attributes}
                {...listeners}
                className="hidden md:block cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </button>
            )}
            <span className="hidden md:block text-zinc-500 text-sm w-6 text-center font-medium">{index + 1}</span>
          </>
        )}

        <div className="relative shrink-0">
          <img
            src={track.thumbnail_url || '/default-thumbnail.jpg'}
            alt={track.title}
            className="w-12 h-12 md:w-16 md:h-16 rounded object-cover bg-zinc-800"
          />
          {isCurrentTrack && !isSelectionMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
              {isPlaying ? (
                <div className="flex items-end gap-0.5 md:gap-1 h-4 md:h-6">
                  <div className="w-0.5 md:w-1 bg-white rounded-sm equalizer-bar-1" />
                  <div className="w-0.5 md:w-1 bg-white rounded-sm equalizer-bar-2" />
                  <div className="w-0.5 md:w-1 bg-white rounded-sm equalizer-bar-3" />
                  <div className="w-0.5 md:w-1 bg-white rounded-sm equalizer-bar-4" />
                </div>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm md:text-base font-semibold truncate group-hover:text-white transition-colors ${isCurrentTrack && isPlaying && !isSelectionMode ? 'text-white' : 'text-zinc-100'}`}>
            {track.title}
          </h3>
          <p className={`text-xs md:text-sm truncate ${isCurrentTrack && isPlaying && !isSelectionMode ? 'text-zinc-300' : 'text-zinc-400'}`}>
            {track.artist}
          </p>
          {addedByUser && (
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="w-4 h-4 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700"
                title={`Added by ${addedByUser.display_name || addedByUser.username}`}
              >
                {addedByUser.avatar_url ? (
                  <img src={addedByUser.avatar_url} alt={addedByUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400 font-bold">
                    {addedByUser.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[10px] md:text-xs text-zinc-500 truncate">
                {addedByUser.display_name || addedByUser.username}
              </span>
            </div>
          )}
        </div>

        {track.duration && (
          <span className="hidden md:block text-xs text-zinc-500 shrink-0">
            {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
          </span>
        )}

        {!isSelectionMode && (
          <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <TrackOptionsMenu
              videoId={track.video_id}
              title={track.title}
              artist={track.artist}
              thumbnail={track.thumbnail_url}
              duration={track.duration}
              onRemove={isOwner ? onRemove : undefined}
              showRemove={isOwner}
            />
          </div>
        )}
      </div>
    </div>
  );
}


