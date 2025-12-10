import { supabase } from '@/lib/supabase';

export interface GlobalRanking {
    video_id: string;
    title: string;
    artist?: string;
    thumbnail_url?: string;
    total_plays: number;
    unique_listeners: number;
    rank: number;
}

export interface UserTrackRank {
    user_plays: number;
    total_plays: number;
    unique_listeners: number;
    percentile: number;
    is_top_listener: boolean;
}

export class RankingService {
    static async getGlobalTopTracks(limit: number = 50): Promise<GlobalRanking[]> {
        const { data, error } = await supabase
            .from('track_statistics')
            .select('video_id, title, artist, thumbnail_url, total_plays, unique_listeners')
            .order('total_plays', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return (data || []).map((track, index) => ({
            ...track,
            rank: index + 1,
        }));
    }

    static async getUserTrackRank(userId: string, videoId: string): Promise<UserTrackRank | null> {
        const { data: userPlays, error: userError } = await supabase
            .from('play_history')
            .select('id')
            .eq('user_id', userId)
            .eq('video_id', videoId);

        if (userError) {
            throw userError;
        }

        const { data: trackStats, error: trackError } = await supabase
            .from('track_statistics')
            .select('total_plays, unique_listeners')
            .eq('video_id', videoId)
            .single();

        if (trackError && trackError.code !== 'PGRST116') {
            throw trackError;
        }

        if (!trackStats) {
            return null;
        }

        const userPlayCount = userPlays?.length || 0;
        const avgPlaysPerListener = trackStats.unique_listeners > 0
            ? trackStats.total_plays / trackStats.unique_listeners
            : 0;

        const percentile = avgPlaysPerListener > 0
            ? Math.min(100, (userPlayCount / avgPlaysPerListener) * 100)
            : 0;

        return {
            user_plays: userPlayCount,
            total_plays: trackStats.total_plays,
            unique_listeners: trackStats.unique_listeners,
            percentile: Math.round(percentile),
            is_top_listener: percentile >= 90,
        };
    }

    static async getTrendingTracks(limit: number = 20): Promise<GlobalRanking[]> {
        const { data, error } = await supabase
            .from('track_statistics')
            .select('video_id, title, artist, thumbnail_url, total_plays, unique_listeners, plays_last_7_days')
            .order('plays_last_7_days', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return (data || []).map((track, index) => ({
            video_id: track.video_id,
            title: track.title,
            artist: track.artist,
            thumbnail_url: track.thumbnail_url,
            total_plays: track.total_plays,
            unique_listeners: track.unique_listeners,
            rank: index + 1,
        }));
    }

    static async compareWithFriends(userId: string, friendIds: string[]): Promise<any> {
        const allUserIds = [userId, ...friendIds];

        const { data, error } = await supabase
            .from('user_statistics')
            .select('user_id, total_plays, total_listen_time')
            .in('user_id', allUserIds);

        if (error) {
            throw error;
        }

        const userStats = data?.find(s => s.user_id === userId);
        const friendsStats = data?.filter(s => s.user_id !== userId) || [];

        const avgPlays = friendsStats.length > 0
            ? friendsStats.reduce((sum, s) => sum + s.total_plays, 0) / friendsStats.length
            : 0;

        const avgListenTime = friendsStats.length > 0
            ? friendsStats.reduce((sum, s) => sum + s.total_listen_time, 0) / friendsStats.length
            : 0;

        return {
            user: userStats,
            friends_average: {
                total_plays: Math.round(avgPlays),
                total_listen_time: Math.round(avgListenTime),
            },
            comparison: {
                plays_diff: userStats ? userStats.total_plays - avgPlays : 0,
                time_diff: userStats ? userStats.total_listen_time - avgListenTime : 0,
            },
        };
    }
}
