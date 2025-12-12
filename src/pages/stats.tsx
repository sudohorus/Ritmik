import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatisticsService } from '@/services/statistics-service';
import { SettingsService } from '@/services/settings-service';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import { useUserStats } from '@/hooks/statistics/useUserStats';

export default function StatsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { stats, loading: statsLoading } = useUserStats();
    const [topTracks, setTopTracks] = useState<any[]>([]);
    const [recentPlays, setRecentPlays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statisticsAllowed, setStatisticsAllowed] = useState<boolean>(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                setLoading(true);

                const allowed = await SettingsService.checkStatisticsAllowed(user.id);
                setStatisticsAllowed(allowed);

                if (!allowed) {
                    setLoading(false);
                    return;
                }

                const [tracks, recent] = await Promise.all([
                    StatisticsService.getTopTracks(user.id, 10),
                    StatisticsService.getRecentPlays(user.id, 15),
                ]);
                setTopTracks(tracks);
                setRecentPlays(recent);
            } catch (err) {
                console.error('Error loading stats:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (authLoading || !user) {
        return <Loading fullScreen text="Loading..." />;
    }

    const uniqueRecentTracks = (() => {
        const trackMap = new Map();
        recentPlays.forEach(play => {
            if (!trackMap.has(play.video_id)) {
                trackMap.set(play.video_id, {
                    ...play,
                    count: 1,
                    last_played: play.played_at
                });
            } else {
                const existing = trackMap.get(play.video_id);
                existing.count++;
                if (new Date(play.played_at) > new Date(existing.last_played)) {
                    existing.last_played = play.played_at;
                }
            }
        });
        return Array.from(trackMap.values()).slice(0, 10);
    })();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-40">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold">Your Stats</h1>
                        <span className="px-3 py-1 bg-blue-950/50 border border-blue-900/50 text-blue-400 text-xs font-semibold rounded-full">
                            BETA
                        </span>
                    </div>
                    <p className="text-zinc-400 mb-3">Your listening activity and top tracks</p>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-zinc-400">
                                <strong className="text-zinc-300">Beta Feature:</strong> Statistics tracking is currently in beta.
                                Data collection started recently, so your stats may be incomplete. We're continuously improving accuracy and adding new insights!
                            </div>
                        </div>
                    </div>
                </div>

                {statsLoading || loading ? (
                    <Loading text="Loading your stats..." />
                ) : !statisticsAllowed ? (
                    <EmptyState
                        icon={
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        }
                        title="Statistics Tracking Disabled"
                        description="Your statistics are disabled for privacy. When enabled, we only collect your personal listening data (tracks played, listen time) to show your own stats. This data is not shared or sold to anyone."
                        action={{
                            label: "Enable in Settings",
                            onClick: () => router.push('/settings/privacy')
                        }}
                    />
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {stats?.total_plays || 0}
                                </div>
                                <div className="text-sm text-zinc-400">Total Plays</div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {formatTime(stats?.total_listen_time || 0)}
                                </div>
                                <div className="text-sm text-zinc-400">Listen Time</div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {stats?.playlists_created || 0}
                                </div>
                                <div className="text-sm text-zinc-400">Playlists</div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {stats?.followers_count || 0}
                                </div>
                                <div className="text-sm text-zinc-400">Followers</div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Top Tracks</h2>
                                {topTracks.length === 0 ? (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                                        <p className="text-zinc-400">No tracks played yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {topTracks.map((track, index) => (
                                            <div
                                                key={track.video_id}
                                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className="text-2xl font-bold text-zinc-600 w-8 text-center">
                                                    {index + 1}
                                                </div>
                                                {track.thumbnail_url && (
                                                    <img
                                                        src={track.thumbnail_url}
                                                        alt={track.title}
                                                        className="w-12 h-12 rounded object-cover"
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
                                                <div className="text-sm text-zinc-500">
                                                    {track.play_count} plays
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold mb-4">Recent Plays</h2>
                                {uniqueRecentTracks.length === 0 ? (
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                                        <p className="text-zinc-400">No recent plays</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {uniqueRecentTracks.map((play, index) => (
                                            <div
                                                key={`${play.video_id}-${index}`}
                                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:bg-zinc-800 transition-colors"
                                            >
                                                {play.thumbnail_url && (
                                                    <img
                                                        src={play.thumbnail_url}
                                                        alt={play.title}
                                                        className="w-12 h-12 rounded object-cover"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white truncate">
                                                        {play.title}
                                                    </div>
                                                    <div className="text-sm text-zinc-400 truncate">
                                                        {play.artist || 'Unknown Artist'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {play.count > 1 && (
                                                        <div className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                                                            {play.count}x
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-zinc-500">
                                                        {formatDate(play.last_played)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
