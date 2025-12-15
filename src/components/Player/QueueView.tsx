import { useRef, useEffect } from 'react';
import { Track } from '@/types/track';
import { usePlayer } from '@/hooks/player/usePlayer';
import { formatDuration } from '@/utils/format';

interface QueueViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QueueView({ isOpen, onClose }: QueueViewProps) {
    const { queue, currentTrack, playTrack, isPlaying } = usePlayer();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && currentTrack && scrollRef.current) {
            const activeElement = document.getElementById(`queue-item-${currentTrack.videoId}`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [isOpen, currentTrack]);

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-full right-0 mb-4 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[60vh]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10">
                <h3 className="font-semibold text-white">Queue</h3>
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
                        Queue is empty
                    </div>
                ) : (
                    queue.map((track, index) => {
                        const isCurrent = currentTrack?.videoId === track.videoId;
                        return (
                            <div
                                key={`${track.videoId}-${index}`}
                                id={`queue-item-${track.videoId}`}
                                onClick={() => playTrack(track, queue)}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group ${isCurrent ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                                    }`}
                            >
                                <div className="relative w-10 h-10 shrink-0">
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

                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate ${isCurrent ? 'text-green-500' : 'text-zinc-200'}`}>
                                        {track.title}
                                    </div>
                                    <div className="text-xs text-zinc-400 truncate">
                                        {track.artist}
                                    </div>
                                </div>

                                <div className="text-xs text-zinc-500 font-mono">
                                    {formatDuration(track.duration)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
