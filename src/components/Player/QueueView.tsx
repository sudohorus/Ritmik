import { useRef, useEffect, useState } from 'react';
import { usePlayer } from '@/hooks/player/usePlayer';
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localQueue, setLocalQueue] = useState(queue);
    const hasScrolledRef = useRef(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
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
        <div className="absolute bottom-full right-0 mb-4 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Queue</h3>
                    <span className="text-xs text-zinc-500 font-mono">({queue.length})</span>
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
                    ) : null
                )}
            </div>
        </div>
    );
}
