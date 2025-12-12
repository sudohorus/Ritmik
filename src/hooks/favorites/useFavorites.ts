import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatisticsService } from '@/services/statistics-service';
import { PlaylistService } from '@/services/playlist-service';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

export interface FavoriteTrack {
    id: string;
    user_id: string;
    video_id: string;
    title: string;
    artist?: string;
    thumbnail_url?: string;
    duration?: number;
    favorited_at: string;
}

export function useFavorites() {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([]);
            setFavoritesSet(new Set());
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await StatisticsService.getFavorites(user.id);

            if (mountedRef.current) {
                setFavorites(data);
                setFavoritesSet(new Set(data.map(f => f.video_id)));
            }
        } catch (error) {
            if (mountedRef.current) {
                setFavorites([]);
                setFavoritesSet(new Set());
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    const ensureFavoritesPlaylist = useCallback(async (): Promise<string | null> => {
        if (!user) return null;

        try {
            const playlists = await PlaylistService.getUserPlaylists(user.id);

            const { data: userData } = await supabase
                .from('users')
                .select('username, display_name, avatar_url')
                .eq('id', user.id)
                .single();

            const username = userData?.username || userData?.display_name || user.email?.split('@')[0] || 'User';
            const favoritesName = `${username} Favorites`;

            let favoritesPlaylist = playlists.find(p => p.name === favoritesName);

            if (!favoritesPlaylist) {
                favoritesPlaylist = await PlaylistService.createPlaylist(user.id, {
                    name: favoritesName,
                    description: 'Your favorite musics',
                    cover_image_url: userData?.avatar_url || undefined,
                    is_public: false,
                });
            } else {
                if (!favoritesPlaylist.cover_image_url && userData?.avatar_url) {
                    await PlaylistService.updatePlaylist(favoritesPlaylist.id, {
                        cover_image_url: userData.avatar_url,
                        description: 'Your favorite musics',
                    });
                }
            }

            return favoritesPlaylist.id;
        } catch (error) {
            return null;
        }
    }, [user]);

    const isFavorite = useCallback((videoId: string): boolean => {
        return favoritesSet.has(videoId);
    }, [favoritesSet]);

    const addToFavorites = useCallback(async (
        videoId: string,
        title: string,
        artist?: string,
        thumbnailUrl?: string,
        duration?: number
    ) => {
        if (!user) {
            showToast.error('Please login to add favorites');
            return false;
        }

        if (favoritesSet.has(videoId)) {
            showToast.success('Already in favorites');
            return false;
        }

        try {
            if (mountedRef.current) {
                const newFavorite: FavoriteTrack = {
                    id: videoId,
                    user_id: user.id,
                    video_id: videoId,
                    title,
                    artist,
                    thumbnail_url: thumbnailUrl,
                    duration,
                    favorited_at: new Date().toISOString(),
                };

                setFavorites(prev => [newFavorite, ...prev]);
                setFavoritesSet(prev => new Set([...prev, videoId]));
                showToast.success('Added to favorites');
            }

            await StatisticsService.addToFavorites(videoId, title, artist, thumbnailUrl, duration);

            ensureFavoritesPlaylist().then(playlistId => {
                if (playlistId) {
                    PlaylistService.addTrackToPlaylist({
                        playlist_id: playlistId,
                        track_id: videoId,
                        title,
                        artist,
                        thumbnail: thumbnailUrl,
                        duration,
                    })
                }
            });

            return true;
        } catch (error) {
            showToast.error('Failed to add to favorites');
            return false;
        }
    }, [user, favoritesSet]);

    const removeFromFavorites = useCallback(async (videoId: string) => {
        if (!user) {
            showToast.error('Please login to remove favorites');
            return false;
        }

        try {
            if (mountedRef.current) {
                setFavorites(prev => prev.filter(f => f.video_id !== videoId));
                setFavoritesSet(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(videoId);
                    return newSet;
                });
                showToast.success('Removed from favorites');
            }

            await StatisticsService.removeFromFavorites(videoId);

            ensureFavoritesPlaylist().then(playlistId => {
                if (playlistId) {
                    PlaylistService.removeTrackFromPlaylist(playlistId, videoId).catch(() => { });
                }
            });

            return true;
        } catch (error) {
            showToast.error('Failed to remove from favorites');
            return false;
        }
    }, [user]);

    const toggleFavorite = useCallback(async (
        videoId: string,
        title: string,
        artist?: string,
        thumbnailUrl?: string,
        duration?: number
    ) => {
        if (favoritesSet.has(videoId)) {
            return await removeFromFavorites(videoId);
        } else {
            return await addToFavorites(videoId, title, artist, thumbnailUrl, duration);
        }
    }, [favoritesSet, addToFavorites, removeFromFavorites]);

    return {
        favorites,
        loading,
        isFavorite,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        refreshFavorites: loadFavorites,
    };
}
