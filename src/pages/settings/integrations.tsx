import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';

export default function IntegrationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

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
                    <span className="text-white">Integrations</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3">Integrations</h1>
                    <p className="text-zinc-400">Connect external music services to enhance your experience</p>
                </div>

                <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-semibold rounded-full border border-amber-500/20">
                            Coming Soon
                        </span>
                    </div>

                    <div className="flex items-start justify-between opacity-60 pointer-events-none">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#1DB954] flex items-center justify-center shrink-0">
                                <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Spotify</h3>
                                <p className="text-sm text-zinc-400 mb-2">Import playlists from your Spotify account</p>
                                <p className="text-xs text-zinc-500 max-w-md">
                                    Currently unavailable due to Spotify API restrictions. We're working on alternative solutions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
