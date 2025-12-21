import { useState, useRef, useEffect } from 'react';
import { TrackOptionsMenuProps } from '@/types/track-options';
import { calculateMenuPosition } from '@/utils/menu-position';
import { showToast } from '@/lib/toast';

export default function TrackOptionsMenu({
    videoId,
    title,
    artist,
    onRemove,
    onAddToPlaylist,
    showRemove = true,
}: TrackOptionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = `${window.location.origin}/?play=${videoId}`;
        navigator.clipboard.writeText(link);
        setIsOpen(false);
        showToast.success('Link copied to clipboard');
    };

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-2 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white"
                title="More options"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="fixed w-56 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 z-9999 overflow-hidden"
                    style={calculateMenuPosition(buttonRef.current)}
                >
                    <div className="py-1">
                        <div className="px-4 py-3 border-b border-zinc-700">
                            <p className="text-xs font-medium text-zinc-400 truncate">{title}</p>
                            {artist && <p className="text-xs text-zinc-500 truncate">{artist}</p>}
                        </div>

                        {onAddToPlaylist && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(onAddToPlaylist);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-zinc-700 transition-colors flex items-center gap-3 text-sm text-zinc-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span>Add to Playlist</span>
                            </button>
                        )}

                        <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-2.5 text-left hover:bg-zinc-700 transition-colors flex items-center gap-3 text-sm text-zinc-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>Copy Link</span>
                        </button>

                        {showRemove && onRemove && (
                            <>
                                <div className="border-t border-zinc-700 my-1" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(onRemove);
                                    }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-red-950/50 transition-colors flex items-center gap-3 text-sm text-red-400"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Remove from Playlist</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
