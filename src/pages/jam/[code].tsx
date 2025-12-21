import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useJam } from '@/contexts/JamContext';
import { JamService } from '@/services/jam-service';
import { showToast } from '@/lib/toast';
import Head from 'next/head';

export default function JamInvitePage() {
    const router = useRouter();
    const { code } = router.query;
    const { user, loading: authLoading } = useAuth();
    const { joinJam } = useJam();
    const [loading, setLoading] = useState(true);
    const [jamDetails, setJamDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code || typeof code !== 'string' || authLoading) return;

        const fetchJamDetails = async () => {
            try {
                setLoading(true);
                // We'll need a public endpoint or use the service if it allows public reads
                // For now, let's assume we need to be logged in to even see details, 
                // or we can try to fetch basic info. 
                // Since our RLS might block unauthenticated reads, we might need to handle that.
                // But let's try to fetch via the API we have or a new one.
                // Actually, let's just use the join flow directly or show a "Join" button.

                // Let's try to fetch basic info first.
                // If we are not logged in, we should redirect to login with a return URL.
                if (!user) {
                    router.push(`/login?returnUrl=/jam/${code}`);
                    return;
                }

                // Check if jam exists and get details
                // We can't use JamService directly on client side easily without exposing it or using API
                // Let's use a new API endpoint or just try to join.
                // Better UX: Show "You are invited to join [Jam Name] hosted by [Host]"

                // For now, let's just try to join immediately if the user clicks a button.
                setLoading(false);
            } catch (err) {
                setError('Failed to load jam details');
                setLoading(false);
            }
        };

        fetchJamDetails();
    }, [code, user, authLoading, router]);

    const handleJoin = async () => {
        if (!code || typeof code !== 'string') return;

        try {
            setLoading(true);
            await joinJam(code);
            showToast.success('Joined jam successfully!');
            router.push('/'); // Redirect to player/home
        } catch (err: any) {
            setError(err.message || 'Failed to join jam');
            showToast.error(err.message || 'Failed to join jam');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <Head>
                <title>Join Jam - Ritmik</title>
            </Head>

            <div className="max-w-md w-full bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Join Jam Session</h1>
                <p className="text-zinc-400 mb-8">
                    You've been invited to join a Jam Session with code <span className="font-mono text-white font-bold">{code}</span>
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Joining...' : 'Join Now'}
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
