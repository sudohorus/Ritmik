import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX } from 'lucide-react';
import { Track } from '@/types/track';

interface MiniPlayerProps {
    currentTrack: Track;
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    onVolumeChange: (volume: number) => void;
    isShuffle: boolean;
    repeatMode: 'off' | 'context' | 'track';
    onTogglePlay: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (time: number) => void;
    onToggleShuffle: () => void;
    onToggleRepeat: () => void;
    pipWindow: Window;
    closePip: () => void;
}

export default function MiniPlayer({
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    onVolumeChange,
    isShuffle,
    repeatMode,
    onTogglePlay,
    onNext,
    onPrevious,
    onSeek,
    onToggleShuffle,
    onToggleRepeat,
    pipWindow,
    closePip
}: MiniPlayerProps) {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [windowWidth, setWindowWidth] = useState(400);
    const volumeSliderRef = useRef<HTMLDivElement>(null);

    const getVolumeFromPosition = (clientX: number) => {
        if (!volumeSliderRef.current) return volume;
        const bounds = volumeSliderRef.current.getBoundingClientRect();
        const x = clientX - bounds.left;
        return Math.max(0, Math.min(1, x / bounds.width));
    };

    const handleVolumeMouseDown = (e: React.MouseEvent) => {
        setIsDraggingVolume(true);
        const newVolume = getVolumeFromPosition(e.clientX);
        onVolumeChange(newVolume);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDraggingVolume || !pipWindow) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newVolume = getVolumeFromPosition(e.clientX);
            onVolumeChange(newVolume);
        };
        const handleMouseUp = () => setIsDraggingVolume(false);

        try {
            pipWindow.document.addEventListener('mousemove', handleMouseMove);
            pipWindow.document.addEventListener('mouseup', handleMouseUp);
        } catch (e) {
            console.warn('Could not attach volume listeners:', e);
        }

        return () => {
            try {
                pipWindow.document.removeEventListener('mousemove', handleMouseMove);
                pipWindow.document.removeEventListener('mouseup', handleMouseUp);
            } catch (e) {
            }
        };
    }, [isDraggingVolume, pipWindow]);

    useEffect(() => {
        if (!pipWindow) return;

        const updateWidth = () => {
            setWindowWidth(pipWindow.innerWidth);
        };

        updateWidth();

        pipWindow.addEventListener('resize', updateWidth);

        return () => {
            pipWindow.removeEventListener('resize', updateWidth);
        };
    }, [pipWindow]);

    useEffect(() => {
        const style = pipWindow.document.createElement('style');
        style.textContent = `
            html, body {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #09090b;
                min-width: 0;
                min-height: 0;
            }
            #mini-player-root {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
            }
        `;
        pipWindow.document.head.appendChild(style);

        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((styleSheet) => {
            try {
                if (styleSheet.href) {
                    const newLink = pipWindow.document.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = styleSheet.href;
                    pipWindow.document.head.appendChild(newLink);
                } else if (styleSheet.cssRules) {
                    const newStyle = pipWindow.document.createElement('style');
                    Array.from(styleSheet.cssRules).forEach((rule) => {
                        newStyle.appendChild(pipWindow.document.createTextNode(rule.cssText));
                    });
                    pipWindow.document.head.appendChild(newStyle);
                }
            } catch (e) {
                console.warn('Could not copy stylesheet', e);
            }
        });

        const div = pipWindow.document.createElement('div');
        div.id = 'mini-player-root';
        div.className = 'h-full w-full bg-zinc-950 text-white overflow-hidden';
        pipWindow.document.body.appendChild(div);
        setContainer(div);

        pipWindow.document.title = `${currentTrack.title} - Ritmik`;

        return () => {
            try {
                if (pipWindow.document.body.contains(div)) {
                    pipWindow.document.body.removeChild(div);
                }
            } catch (e) {

            }
        };
    }, [pipWindow, currentTrack.title]);

    if (!container) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const showShuffle = windowWidth >= 380;
    const showRepeat = windowWidth >= 380;
    const showVolume = windowWidth >= 280;
    const showTimeLabels = windowWidth >= 240;
    const showTrackInfo = windowWidth >= 200;
    const showProgressBar = windowWidth >= 180;
    const showPrevious = windowWidth >= 130;

    const isUltraCompact = windowWidth < 130;
    const controlsGap = windowWidth >= 300 ? '1.5rem' : windowWidth >= 200 ? '1rem' : '0.5rem';
    const playButtonSize = windowWidth >= 300 ? { padding: '1rem', iconSize: '1.5rem' } :
        windowWidth >= 180 ? { padding: '0.75rem', iconSize: '1.25rem' } :
            { padding: '0.65rem', iconSize: '1.1rem' };

    return createPortal(
        <div className="flex flex-col h-full relative group select-none">
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm will-change-[backdrop-filter]" />

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 w-full" style={{ padding: windowWidth < 150 ? '0.5rem' : '1rem', gap: windowWidth < 150 ? '0.5rem' : '1rem' }}>

                {/* Track Info - Progressive hiding */}
                {showTrackInfo && (
                    <div className="text-center w-full" style={{ padding: '0 1rem' }}>
                        <h2
                            className="font-bold truncate text-white drop-shadow-md"
                            style={{ fontSize: windowWidth >= 250 ? '1.125rem' : '0.875rem', marginBottom: '0.25rem' }}
                            title={currentTrack.title}
                        >
                            {currentTrack.title}
                        </h2>
                        <p
                            className="text-zinc-300 truncate drop-shadow-md"
                            style={{ fontSize: windowWidth >= 250 ? '0.875rem' : '0.75rem' }}
                            title={currentTrack.artist}
                        >
                            {currentTrack.artist}
                        </p>
                    </div>
                )}

                {/* Controls - always visible but adaptive */}
                <div className="flex items-center" style={{ gap: controlsGap }}>
                    {/* Shuffle - lowest priority */}
                    {showShuffle && (
                        <button
                            onClick={onToggleShuffle}
                            className={`p-2 rounded-full transition-colors shrink-0 ${isShuffle ? 'text-green-400' : 'text-zinc-400 hover:text-white'}`}
                            title="Shuffle"
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>
                    )}

                    {/* Previous */}
                    {showPrevious && (
                        <button
                            onClick={onPrevious}
                            className="p-2 text-white hover:scale-110 transition-transform drop-shadow-lg shrink-0 will-change-transform transform-gpu"
                            title="Previous"
                        >
                            <SkipBack style={{ width: '1.5rem', height: '1.5rem' }} className="fill-current" />
                        </button>
                    )}

                    {/* Play/Pause - ALWAYS visible, core control */}
                    <button
                        onClick={onTogglePlay}
                        className="bg-white text-black rounded-full hover:scale-105 transition-transform shadow-xl shrink-0 will-change-transform transform-gpu"
                        style={{ padding: playButtonSize.padding }}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <Pause className="fill-current" style={{ width: playButtonSize.iconSize, height: playButtonSize.iconSize }} />
                        ) : (
                            <Play className="fill-current ml-1" style={{ width: playButtonSize.iconSize, height: playButtonSize.iconSize }} />
                        )}
                    </button>

                    {/* Next - ALWAYS visible */}
                    <button
                        onClick={onNext}
                        className="p-2 text-white hover:scale-110 transition-transform drop-shadow-lg shrink-0 will-change-transform transform-gpu"
                        title="Next"
                    >
                        <SkipForward style={{ width: '1.5rem', height: '1.5rem' }} className="fill-current" />
                    </button>

                    {/* Repeat - lowest priority */}
                    {showRepeat && (
                        <button
                            onClick={onToggleRepeat}
                            className={`p-2 rounded-full transition-colors relative shrink-0 ${repeatMode !== 'off' ? 'text-green-400' : 'text-zinc-400 hover:text-white'}`}
                            title="Repeat"
                        >
                            <Repeat className="w-4 h-4" />
                            {repeatMode === 'track' && (
                                <span className="absolute top-1 right-1 text-[8px] font-bold bg-zinc-900 rounded-full w-3 h-3 flex items-center justify-center">1</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Progress Bar - adaptive width */}
                {showProgressBar && (
                    <div className="w-full flex items-center text-xs font-medium text-zinc-300 drop-shadow-md" style={{ maxWidth: '20rem', gap: '0.75rem' }}>
                        {showTimeLabels && <span className="w-8 text-right shrink-0">{formatTime(progress)}</span>}
                        <div
                            className="flex-1 h-1 bg-white/20 rounded-full relative cursor-pointer group/progress"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                onSeek(percent * duration);
                            }}
                        >
                            <div
                                className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                style={{ width: `${(progress / duration) * 100}%` }}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
                                style={{ left: `${(progress / duration) * 100}%` }}
                            />
                        </div>
                        {showTimeLabels && <span className="w-8 shrink-0">{formatTime(duration)}</span>}
                    </div>
                )}

                {/* Volume Control */}
                {showVolume && (
                    <div className="flex items-center gap-2 w-full group/volume" style={{ maxWidth: '9.375rem' }}>
                        <button
                            onClick={() => onVolumeChange(volume > 0 ? 0 : 1.0)}
                            className="text-zinc-400 hover:text-white transition-colors shrink-0"
                            title={volume === 0 ? 'Unmute' : 'Mute'}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                {volume === 0 ? (
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                ) : volume < 0.5 ? (
                                    <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                                ) : (
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                                )}
                            </svg>
                        </button>
                        <div
                            ref={volumeSliderRef}
                            onMouseDown={handleVolumeMouseDown}
                            className="relative w-full h-1 bg-zinc-800 rounded-full cursor-pointer group"
                        >
                            <div
                                className="absolute h-full bg-white rounded-full transition-all"
                                style={{ width: `${volume * 100}%` }}
                            />
                            <div
                                className="absolute top-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${volume * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>,
        container
    );
}