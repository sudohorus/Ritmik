import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicProfileService, PublicProfile } from '@/services/public-profile-service';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';

export default function UserPlaylistsPage() {
    const router = useRouter();
    const { query, isReady } = router;
    const { username } = query;
    const normalizedUsername = Array.isArray(username) ? username[0] : username;
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isReady || !normalizedUsername) {
            setLoading(false);
            return;
        }

        let active = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const { data: profileData, error: profileError } = await PublicProfileService.getProfileByUsername(normalizedUsername);

            if (!active) return;

            if (profileError || !profileData) {
                setError('User not found');
                setLoading(false);
                return;
            }

            setProfile(profileData);

            const { data: playlistsData } = await PublicProfileService.getUserPlaylists(profileData.id);

            if (!active) return;

            setPlaylists(playlistsData || []);
            setLoading(false);
        };

        fetchData();

        return () => {
            active = false;
        };
    }, [isReady, normalizedUsername]);

    if (loading) {
        return <Loading fullScreen text="Loading playlists..." />;
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen text-zinc-100 pb-24">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="text-center">
                        <h1 className="text-xl sm:text-2xl font-bold mb-4">User not found</h1>
                        <Link href="/" className="text-blue-500 hover:underline">
                            Go back home
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const displayName = profile.display_name || profile.username || 'User';

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 sm:pb-32">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="mb-8">
                    <Link
                        href={`/u/${profile.username}`}
                        className="inline-flex items-center text-zinc-400 hover:text-white mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Profile
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">{displayName}'s Playlists</h1>
                    <p className="text-zinc-400">All public playlists</p>
                </div>

                {playlists.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <p className="text-zinc-400">No public playlists yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {playlists.map((playlist) => (
                            <Link
                                key={playlist.id}
                                href={`/playlists/${playlist.id}`}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
                            >
                                <div className="aspect-square bg-zinc-800 rounded-lg mb-3 sm:mb-4 flex items-center justify-center overflow-hidden">
                                    {playlist.cover_image_url ? (
                                        <img
                                            src={playlist.cover_image_url}
                                            alt={playlist.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    )}
                                </div>
                                <h3 className="font-semibold text-base sm:text-lg mb-1 truncate group-hover:text-white transition-colors">
                                    {playlist.name}
                                </h3>
                                {playlist.description && (
                                    <p className="text-xs sm:text-sm text-zinc-400 mb-2 line-clamp-2">{playlist.description}</p>
                                )}
                                <div className="text-xs text-zinc-500 mt-2">
                                    {new Date(playlist.created_at).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
