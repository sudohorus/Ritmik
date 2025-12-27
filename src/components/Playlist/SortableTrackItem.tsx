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
  disabled?: boolean;
}

export default function SortableTrackItem({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  isOwner,
  onPlay,
  onRemove,
  disabled = false,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.video_id, disabled: !isOwner || disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 md:p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-2 md:gap-4">
        {isOwner && !disabled && (
          <button
            {...attributes}
            {...listeners}
            className="hidden md:block cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        )}

        <span className="hidden md:block text-zinc-500 text-sm w-6 text-center font-medium">{index + 1}</span>

        <div className="relative shrink-0" onClick={onPlay}>
          <img
            src={track.thumbnail_url || '/default-thumbnail.jpg'}
            alt={track.title}
            className="w-12 h-12 md:w-16 md:h-16 rounded object-cover bg-zinc-800"
          />
          {isCurrentTrack && (
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

        <div onClick={onPlay} className="flex-1 min-w-0">
          <h3 className={`text-sm md:text-base font-semibold truncate group-hover:text-white transition-colors ${isCurrentTrack && isPlaying ? 'text-white' : 'text-zinc-100'}`}>
            {track.title}
          </h3>
          <p className={`text-xs md:text-sm truncate ${isCurrentTrack && isPlaying ? 'text-zinc-300' : 'text-zinc-400'}`}>
            {track.artist}
          </p>
        </div>

        {track.duration && (
          <span className="hidden md:block text-xs text-zinc-500 shrink-0">
            {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
          </span>
        )}

        <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
      </div>
    </div>
  );
}


