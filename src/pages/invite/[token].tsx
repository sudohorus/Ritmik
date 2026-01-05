import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';

export default function InvitePage() {
    const router = useRouter();
    const { token } = router.query;
    const { user, loading: authLoading } = useAuth();
    const [inviteData, setInviteData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (!token || typeof token !== 'string') return;

        const validate = async () => {
            try {
                const data = await PlaylistService.validateInvite(token);
                setInviteData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Invalid invite');
            } finally {
                setLoading(false);
            }
        };

        validate();
    }, [token]);

    const handleJoin = async () => {
        if (!user) {
            router.push(`/login?redirect=/invite/${token}`);
            return;
        }

        setJoining(true);
        try {
            await PlaylistService.acceptInvite(token as string);
            router.push(`/playlists/${inviteData.playlist.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join playlist');
            setJoining(false);
        }
    };

    if (authLoading || (loading && token)) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <Loading text="Loading invite..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <Navbar />

            <div className="max-w-md mx-auto px-4 py-20">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center shadow-2xl">
                    {error ? (
                        <div>
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
                            <p className="text-zinc-400 mb-6">{error}</p>
                            <Link href="/" className="text-white bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-full font-medium transition-colors">
                                Go Home
                            </Link>
                        </div>
                    ) : inviteData ? (
                        <div>
                            <div className="w-24 h-24 mx-auto mb-6 rounded-lg overflow-hidden shadow-lg">
                                {inviteData.playlist.cover_image_url ? (
                                    <img src={inviteData.playlist.cover_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold mb-2">{inviteData.playlist.name}</h1>
                            <p className="text-zinc-400 mb-6">
                                Invited by <span className="text-white font-medium">
                                    {inviteData.invite.created_by === user?.id
                                        ? 'You'
                                        : (inviteData.invite.inviter?.display_name || inviteData.invite.inviter?.username || 'a friend')}
                                </span>
                            </p>

                            {inviteData.playlist.playlist_collaborators && inviteData.playlist.playlist_collaborators.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Collaborators</p>
                                    <div className="flex justify-center -space-x-2">
                                        {inviteData.playlist.playlist_collaborators.map((c: any) => (
                                            <div key={c.user_id} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden" title={c.users?.display_name || c.users?.username}>
                                                {c.users?.avatar_url ? (
                                                    <img src={c.users.avatar_url} alt={c.users.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                                                        {c.users?.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="w-full py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            >
                                {joining ? 'Joining...' : 'Join Playlist'}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
