import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import ConfirmModal from '@/components/Playlist/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

export default function SecurityPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return <Loading fullScreen text="Loading..." />;
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('No session');

            const response = await fetch('/api/user/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            await supabase.auth.signOut();
            router.push('/');
            showToast.success('Account deleted successfully');
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast.error('Failed to delete account. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
                    <Link href="/settings" className="hover:text-white transition-colors">
                        Settings
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-white">Security</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3">Security Settings</h1>
                    <p className="text-zinc-400">Manage your account security and data</p>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-8 border border-zinc-800">
                    <div className="pt-4">
                        <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
                        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-medium text-red-200 mb-1">Delete Account</h4>
                                <p className="text-sm text-red-400/80">
                                    Permanently delete your account and all of your content. This action cannot be undone.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shrink-0"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your playlists and data."
                confirmText={isDeleting ? "Deleting..." : "Delete Account"}
                cancelText="Cancel"
                isDanger
                confirmString={user?.username ? `@${user.username}` : undefined}
            />
        </div>
    );
}
