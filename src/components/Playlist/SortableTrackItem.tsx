import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlaylistTrack } from '@/types/playlist';

interface SortableTrackItemProps {
  track: PlaylistTrack;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isOwner: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

export default function SortableTrackItem({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  isOwner,
  onPlay,
  onRemove,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.video_id, disabled: !isOwner });

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
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {isOwner && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        )}
        
        <span className="text-zinc-500 text-sm w-6 text-center font-medium">{index + 1}</span>
        
        <div className="relative" onClick={onPlay}>
          <img
            src={track.thumbnail_url || '/default-thumbnail.jpg'}
            alt={track.title}
            className="w-16 h-16 rounded-md object-cover bg-zinc-800"
          />
          {isCurrentTrack && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
              {isPlaying ? (
                <div className="flex items-end gap-1 h-6">
                  <div className="w-1 bg-white rounded-sm equalizer-bar-1" />
                  <div className="w-1 bg-white rounded-sm equalizer-bar-2" />
                  <div className="w-1 bg-white rounded-sm equalizer-bar-3" />
                  <div className="w-1 bg-white rounded-sm equalizer-bar-4" />
                </div>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          )}
        </div>

        <div onClick={onPlay} className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate group-hover:text-white transition-colors ${isCurrentTrack && isPlaying ? 'text-white' : 'text-zinc-100'}`}>
            {track.title}
          </h3>
          <p className={`text-sm truncate ${isCurrentTrack && isPlaying ? 'text-zinc-300' : 'text-zinc-400'}`}>
            {track.artist}
          </p>
          {track.duration && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-zinc-600">
                {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-700 rounded-lg transition-all"
            title="Remove from playlist"
          >
            <svg className="w-5 h-5 text-zinc-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

