import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import GenericDecorationModal from '@/components/Modals/GenericDecorationModal';
import { DecorationService } from '@/services/decoration-service';
import { AvatarDecoration } from '@/types/avatar-decoration';

export default function ClaimPage() {
    const router = useRouter();
    const { code } = router.query;
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unauthorized'>('loading');
    const [message, setMessage] = useState('');
    const [decoration, setDecoration] = useState<AvatarDecoration | null>(null);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            setStatus('unauthorized');
            return;
        }

        if (!code || typeof code !== 'string') return;

        const fetchDecoration = async () => {
            try {
                let targetDecoration = '';
                if (code === 'siff-dog') targetDecoration = 'Siff Dog';
                else if (code === 'darksign') targetDecoration = 'Darksign';
                else {
                    setStatus('error');
                    setMessage('Invalid claim code.');
                    return;
                }

                const { data } = await supabase
                    .from('avatar_decorations')
                    .select('*')
                    .eq('name', targetDecoration)
                    .single();

                if (!data) {
                    setStatus('error');
                    setMessage('Decoration not found in database.');
                    return;
                }

                setDecoration(data);
                setStatus('ready');
            } catch (error) {
                console.error('Fetch error:', error);
                setStatus('error');
                setMessage('Failed to load reward. Please try again.');
            }
        };

        fetchDecoration();
    }, [code, user, loading]);

    const handleClaim = async (shouldEquip: boolean) => {
        if (!user || !decoration) return { success: false };

        const claimResult = await DecorationService.claimDecoration(user.id, decoration.id);
        if (!claimResult.success) return claimResult;

        if (shouldEquip) {
            await DecorationService.equipDecoration(user.id, decoration.id);
        }

        return { success: true };
    };

    const handleClose = () => {
        router.push(`/explore`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (status === 'unauthorized') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Sign in to Claim</h1>
                <p className="text-zinc-400 mb-8">You need to be logged in to claim this reward.</p>
                <Link
                    href={`/login?redirect=/claim/${code}`}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                    Sign In
                </Link>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                    <p className="text-zinc-400 mb-8">{message}</p>
                    <Link
                        href="/"
                        className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors block"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            {status === 'ready' && decoration && user && (
                <GenericDecorationModal
                    user={user}
                    decoration={decoration}
                    title="Exclusive Reward Found!"
                    subtitle="Limited Edition"
                    description={
                        <span>
                            You found the <span className="text-white font-bold">{decoration.name}</span> decoration!
                            <br />
                            {decoration.description}
                        </span>
                    }
                    onClaim={handleClaim}
                    onClose={handleClose}
                    themeColor={decoration.name === 'Darksign' ? '#fbbf24' : '#6366f1'}
                />
            )}
        </div>
    );
}
