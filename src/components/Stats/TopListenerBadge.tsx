import { useEffect, useState } from 'react';
import { RankingService, UserTrackRank } from '@/services/ranking-service';
import { useAuth } from '@/contexts/AuthContext';

interface TopListenerBadgeProps {
    videoId: string;
}

export default function TopListenerBadge({ videoId }: TopListenerBadgeProps) {
    const { user } = useAuth();
    const [rank, setRank] = useState<UserTrackRank | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !videoId) {
            setLoading(false);
            return;
        }

        const loadRank = async () => {
            try {
                const data = await RankingService.getUserTrackRank(user.id, videoId);
                setRank(data);
            } catch (err) {
                console.error('Error loading rank:', err);
            } finally {
                setLoading(false);
            }
        };

        loadRank();
    }, [user, videoId]);

    if (loading || !rank || !rank.is_top_listener) {
        return null;
    }

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-700/50 rounded-full">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-semibold text-yellow-200">
                Top Listener
            </span>
            <span className="text-xs text-yellow-300/70">
                Top {rank.percentile}%
            </span>
        </div>
    );
}
