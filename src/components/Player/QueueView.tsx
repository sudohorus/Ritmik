import { useRef, useEffect, useState } from 'react';
import { usePlayer } from '@/hooks/player/usePlayer';
import { useJam } from '@/contexts/JamContext';
import { QueueViewProps } from '@/types/queue';
import QueueItem from './QueueItem';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export default function QueueView({ isOpen, onClose }: QueueViewProps) {
    const { queue, currentTrack, playFromQueue, isPlaying, removeFromQueue, reorderQueue } = usePlayer();
    const { isInJam, isHost } = useJam();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localQueue, setLocalQueue] = useState(queue);
    const hasScrolledRef = useRef(false);

    const canModifyQueue = !isInJam || isHost;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setLocalQueue(queue);
    }, [queue]);

    useEffect(() => {
        if (!isOpen) {
            hasScrolledRef.current = false;
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && currentTrack && scrollRef.current && !hasScrolledRef.current) {
            const currentIndex = queue.findIndex(t => t.videoId === currentTrack.videoId);
            if (currentIndex !== -1) {
                const activeElement = document.getElementById(`queue-item-${currentTrack.videoId}-${currentIndex}`);
                if (activeElement) {
                    setTimeout(() => {
                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        hasScrolledRef.current = true;
                    }, 100);
                }
            }
        }
    }, [isOpen, currentTrack, queue]);

    const handleDragEnd = (event: DragEndEvent) => {
        if (!canModifyQueue) return;

        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localQueue.findIndex((t, i) => t.videoId + '-' + i === active.id);
            const newIndex = localQueue.findIndex((t, i) => t.videoId + '-' + i === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newQueue = arrayMove(localQueue, oldIndex, newIndex);
                setLocalQueue(newQueue);
                reorderQueue(oldIndex, newIndex);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Queue</h3>
                    <span className="text-xs text-zinc-500 font-mono">({queue.length})</span>
                    {!canModifyQueue && (
                        <div className="flex items-center gap-1 text-xs text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                            </svg>
                            <span>Read-only</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1" ref={scrollRef}>
                {queue.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <p className="text-sm">Queue is empty</p>
                        <p className="text-xs mt-1">Play a song or playlist to get started</p>
                    </div>
                ) : (
                    localQueue.length > 0 ? (
                        canModifyQueue ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={localQueue.map((t, i) => t.videoId + '-' + i)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {localQueue.map((track, index) => {
                                        const isCurrent = currentTrack?.videoId === track.videoId && queue.findIndex(t => t.videoId === currentTrack.videoId) === index;
                                        return (
                                            <QueueItem
                                                key={`${track.videoId}-${index}`}
                                                track={track}
                                                index={index}
                                                isCurrent={isCurrent}
                                                isPlaying={isPlaying}
                                                onPlay={() => playFromQueue(index)}
                                                onRemove={() => removeFromQueue(index)}
                                            />
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div className="space-y-1">
                                {localQueue.map((track, index) => {
                                    const isCurrent = currentTrack?.videoId === track.videoId && queue.findIndex(t => t.videoId === currentTrack.videoId) === index;
                                    return (
                                        <div key={`${track.videoId}-${index}`} className="opacity-75">
                                            <QueueItem
                                                track={track}
                                                index={index}
                                                isCurrent={isCurrent}
                                                isPlaying={isPlaying}
                                                onPlay={() => { }}
                                                onRemove={() => { }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : null
                )}
            </div>
        </div>
    );
}
