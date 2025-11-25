import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';
import { useAsyncData } from '@/hooks/useAsyncData';

export function usePlaylists() {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: playlists, loading, error, refetch } = useAsyncData<Playlist[]>({
    fetchFn: async () => {
      if (!user?.id) return [];
      return await PlaylistService.getUserPlaylists(user.id);
    },
    dependencies: [user?.id],
    enabled: !!user?.id,
  });

  const createPlaylist = async (data: CreatePlaylistData) => {
    if (!user) throw new Error('User not authenticated');

    setActionLoading(true);

    try {
      await PlaylistService.createPlaylist(user.id, data);
      await refetch();
      setActionLoading(false);
    } catch (err) {
      setActionLoading(false);
      throw err;
    }
  };

  const updatePlaylist = async (playlistId: string, data: Partial<CreatePlaylistData>) => {
    if (!user) throw new Error('User not authenticated');

    setActionLoading(true);

    try {
      await PlaylistService.updatePlaylist(playlistId, data);
      await refetch();
      setActionLoading(false);
    } catch (err) {
      setActionLoading(false);
      throw err;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    setActionLoading(true);

    try {
      await PlaylistService.deletePlaylist(playlistId);
      await refetch();
      setActionLoading(false);
    } catch (err) {
      setActionLoading(false);
      throw err;
    }
  };

  return {
    playlists: playlists || [],
    loading: loading || actionLoading,
    error: error?.message || null,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  };
}
