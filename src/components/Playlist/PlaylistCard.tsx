import Link from 'next/link';
import { Playlist } from '@/types/playlist';

interface PlaylistCardProps {
    playlist: Playlist;
    disableLink?: boolean;
}

export default function PlaylistCard({ playlist, disableLink }: PlaylistCardProps) {
    const owner = (playlist as any).users;
    const ownerUsername = owner?.username;
    const isNew = new Date(playlist.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    if (disableLink) {
        return (
            <div className="bg-zinc-950 p-4 group relative block">
                <div className="aspect-square bg-zinc-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {isNew && (
                        <div className="absolute top-2 left-2 z-10">
                            <div className="px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded shadow-lg">
                                NEW
                            </div>
                        </div>
                    )}
                    {playlist.cover_image_url ? (
                        <img
                            src={playlist.cover_image_url}
                            alt={playlist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform transform-gpu"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80';
                            }}
                        />
                    ) : (
                        <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    )}
                </div>
                <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-white transition-colors">
                    {playlist.name}
                </h3>
                {ownerUsername && (
                    <p className="text-xs text-zinc-500 mb-2">
                        by <span className="hover:text-zinc-400 transition-colors">{owner.display_name || ownerUsername}</span>
                    </p>
                )}
                {playlist.description && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{playlist.description}</p>
                )}
                <div className="mt-4 pt-4 flex flex-col pb-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        Tracks
                    </span>
                    <span className="text-xl font-bold text-white">
                        {playlist.track_count || 0}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Link
            href={`/playlists/${playlist.id}`}
            className="bg-zinc-950 p-4  group relative "
        >
            <div className="aspect-square bg-zinc-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative shadow-inner">
                {isNew && (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded shadow-lg">
                            NEW
                        </div>
                    </div>
                )}
                {playlist.cover_image_url ? (
                    <img
                        src={playlist.cover_image_url}
                        alt={playlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform transform-gpu"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80';
                        }}
                    />
                ) : (
                    <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                )}
            </div>
            <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-white transition-colors">
                {playlist.name}
            </h3>
            {ownerUsername && (
                <p className="text-xs text-zinc-500 mb-2">
                    by <span className="hover:text-zinc-400 transition-colors">{owner.display_name || ownerUsername}</span>
                </p>
            )}
            {playlist.description && (
                <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{playlist.description}</p>
            )}
            <div className="mt-4 pt-4 flex flex-col pb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    Tracks
                </span>
                <span className="text-xl font-bold text-white">
                    {playlist.track_count || 0}
                </span>
            </div>
        </Link>
    );
}
