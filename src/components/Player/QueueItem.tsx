import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QueueItemProps } from '@/types/queue';
import { formatDuration } from '@/utils/format';

export default function QueueItem({
    track,
    index,
    isCurrent,
    isPlaying,
    onPlay,
    onRemove
}: QueueItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: track.videoId + '-' + index });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            id={`queue-item-${track.videoId}-${index}`}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group ${isCurrent ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>

            <div className="text-xs text-zinc-500 font-mono w-6 text-center shrink-0">
                {index + 1}
            </div>

            <div className="relative w-10 h-10 shrink-0" onClick={onPlay}>
                <img
                    src={track.thumbnail}
                    alt={track.title}
                    className={`w-full h-full object-cover rounded ${isCurrent ? 'opacity-50' : ''}`}
                />
                {isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isPlaying ? (
                            <div className="flex items-end gap-1 h-4">
                                <div className="w-1 bg-green-500 rounded-sm equalizer-bar-1" />
                                <div className="w-1 bg-green-500 rounded-sm equalizer-bar-2" />
                                <div className="w-1 bg-green-500 rounded-sm equalizer-bar-3" />
                                <div className="w-1 bg-green-500 rounded-sm equalizer-bar-4" />
                            </div>
                        ) : (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                    </div>
                )}
                {!isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0" onClick={onPlay}>
                <div className={`text-sm font-medium truncate ${isCurrent ? 'text-green-500' : 'text-zinc-200'}`}>
                    {track.title}
                </div>
                <div className="text-xs text-zinc-400 truncate">
                    {track.artist}
                </div>
            </div>

            <div className="text-xs text-zinc-500 font-mono shrink-0">
                {formatDuration(track.duration)}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all text-zinc-400 hover:text-red-400"
                title="Remove from queue"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
