import { supabase } from '@/lib/supabase';

export interface PlayHistoryEntry {
    id?: string;
    user_id: string;
    video_id: string;
    title: string;
    artist?: string;
    thumbnail_url?: string;
    duration?: number;
    playlist_id?: string;
    played_at?: string;
    listen_duration?: number;
    completed?: boolean;
}

export interface UserStats {
    user_id: string;
    total_plays: number;
    total_listen_time: number;
    completed_plays: number;
    playlists_created: number;
    playlists_followed: number;
    tracks_favorited: number;
    followers_count: number;
    following_count: number;
    last_played_at?: string;
}

export interface TrackStats {
    video_id: string;
    title: string;
    artist?: string;
    thumbnail_url?: string;
    duration?: number;
    total_plays: number;
    unique_listeners: number;
    completed_plays: number;
    in_playlists_count: number;
    favorited_count: number;
    plays_last_7_days: number;
    plays_last_30_days: number;
    first_played_at?: string;
    last_played_at?: string;
}

export class StatisticsService {
    static async recordPlay(data: PlayHistoryEntry): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { SettingsService } = await import('./settings-service');
        const allowed = await SettingsService.checkStatisticsAllowed(user.id);

        if (!allowed) {
            return;
        }

        const { error } = await supabase
            .from('play_history')
            .insert({
                user_id: user.id,
                video_id: data.video_id,
                title: data.title,
                artist: data.artist,
                thumbnail_url: data.thumbnail_url,
                duration: data.duration,
                playlist_id: data.playlist_id,
                listen_duration: data.listen_duration,
                completed: data.completed,
            });
    }

    static async getUserStats(userId: string): Promise<UserStats | null> {
        const { data, error } = await supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    }

    static async getRecentPlays(userId: string, limit: number = 20): Promise<PlayHistoryEntry[]> {
        const { data, error } = await supabase
            .from('play_history')
            .select('*')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data || [];
    }

    static async getTopTracks(userId: string, limit: number = 10): Promise<any[]> {
        const { data, error } = await supabase
            .from('play_history')
            .select('video_id, title, artist, thumbnail_url')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        const trackCounts = new Map<string, any>();

        data?.forEach(play => {
            const existing = trackCounts.get(play.video_id);
            if (existing) {
                existing.play_count++;
            } else {
                trackCounts.set(play.video_id, {
                    video_id: play.video_id,
                    title: play.title,
                    artist: play.artist,
                    thumbnail_url: play.thumbnail_url,
                    play_count: 1,
                });
            }
        });

        return Array.from(trackCounts.values())
            .sort((a, b) => b.play_count - a.play_count)
            .slice(0, limit);
    }

    static async getTrendingTracks(limit: number = 20): Promise<TrackStats[]> {
        const { data, error } = await supabase
            .from('track_statistics')
            .select('*')
            .order('plays_last_7_days', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data || [];
    }

    static async getTrackStats(videoId: string): Promise<TrackStats | null> {
        const { data, error } = await supabase
            .from('track_statistics')
            .select('*')
            .eq('video_id', videoId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    }

    static async addToFavorites(videoId: string, title: string, artist?: string, thumbnailUrl?: string, duration?: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('user_favorites')
            .insert({
                user_id: user.id,
                video_id: videoId,
                title,
                artist,
                thumbnail_url: thumbnailUrl,
                duration,
            });

        if (error) {
            throw error;
        }
    }

    static async removeFromFavorites(videoId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('video_id', videoId);

        if (error) {
            throw error;
        }
    }

    static async getFavorites(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('user_favorites')
            .select('*')
            .eq('user_id', userId)
            .order('favorited_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

    static async isFavorite(userId: string, videoId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('video_id', videoId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return !!data;
    }
}
