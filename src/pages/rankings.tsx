import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { RankingService, GlobalRanking } from '@/services/ranking-service';

export default function RankingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [topTracks, setTopTracks] = useState<GlobalRanking[]>([]);
    const [trendingTracks, setTrendingTracks] = useState<GlobalRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'top' | 'trending'>('top');

    useEffect(() => {
        const loadRankings = async () => {
            try {
                setLoading(true);
                const [top, trending] = await Promise.all([
                    RankingService.getGlobalTopTracks(50),
                    RankingService.getTrendingTracks(20),
                ]);
                setTopTracks(top);
                setTrendingTracks(trending);
            } catch (err) {
                console.error('Error loading rankings:', err);
            } finally {
                setLoading(false);
            }
        };

        loadRankings();
    }, []);

    const tracks = activeTab === 'top' ? topTracks : trendingTracks;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-40">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Global Rankings</h1>
                    <p className="text-zinc-400">Most played tracks across all users</p>
                </div>

                <div className="flex gap-2 mb-6 border-b border-zinc-800">
                    <button
                        onClick={() => setActiveTab('top')}
                        className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'top'
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        All Time
                        {activeTab === 'top' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={`px-6 py-3 font-medium transition-colors relative ${activeTab === 'trending'
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        Trending (7 days)
                        {activeTab === 'trending' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                </div>

                {loading ? (
                    <Loading text="Loading rankings..." />
                ) : (
                    <div className="space-y-2">
                        {tracks.map((track) => (
                            <div
                                key={track.video_id}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:bg-zinc-800 transition-colors"
                            >
                                <div className={`text-2xl font-bold w-12 text-center ${track.rank === 1 ? 'text-yellow-400' :
                                        track.rank === 2 ? 'text-zinc-300' :
                                            track.rank === 3 ? 'text-amber-600' :
                                                'text-zinc-600'
                                    }`}>
                                    #{track.rank}
                                </div>

                                {track.thumbnail_url && (
                                    <img
                                        src={track.thumbnail_url}
                                        alt={track.title}
                                        className="w-16 h-16 rounded object-cover"
                                    />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white truncate">
                                        {track.title}
                                    </div>
                                    <div className="text-sm text-zinc-400 truncate">
                                        {track.artist || 'Unknown Artist'}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg font-semibold text-white">
                                        {track.total_plays.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {track.unique_listeners} {track.unique_listeners === 1 ? 'listener' : 'listeners'}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {tracks.length === 0 && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                                <p className="text-zinc-400">No tracks yet. Start listening to see rankings!</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
