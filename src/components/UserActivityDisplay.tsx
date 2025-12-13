import React from 'react';
import { Track } from '@/types/track';
import { usePlayer } from '@/contexts/PlayerContext';

interface UserActivityDisplayProps {
    track: Track | null;
    username: string;
}

export default function UserActivityDisplay({ track, username }: UserActivityDisplayProps) {
    const { playTrack } = usePlayer();

    if (!track) return null;

    return (
        <div
            onClick={() => playTrack(track)}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer group max-w-full"
        >
            <div className="flex gap-0.5 items-end h-3 mb-0.5">
                <div className="w-0.5 bg-green-500 rounded-t-[1px] equalizer-bar-1"></div>
                <div className="w-0.5 bg-green-500 rounded-t-[1px] equalizer-bar-2"></div>
                <div className="w-0.5 bg-green-500 rounded-t-[1px] equalizer-bar-3"></div>
            </div>
            <span className="truncate">
                Listening to <span className="font-medium text-green-400 group-hover:text-green-300">{track.title}</span>
                <span className="mx-1">•</span>
                <span>{track.artist}</span>
            </span>
        </div>
    );
}
