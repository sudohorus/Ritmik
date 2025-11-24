import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await PlaylistService.getUserPlaylists(user.id);
      setPlaylists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (data: CreatePlaylistData) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const newPlaylist = await PlaylistService.createPlaylist(user.id, data);
      setPlaylists(prev => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (err) {
      console.error('Error creating playlist:', err);
      let message = 'Failed to create playlist';
      
      if (err instanceof Error) {
        if (err.message.includes('JWT')) {
          message = 'Please configure Supabase environment variables';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updatePlaylist = async (playlistId: string, data: Partial<CreatePlaylistData>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const updatedPlaylist = await PlaylistService.updatePlaylist(playlistId, data);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
      return updatedPlaylist;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update playlist';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    setLoading(true);
    setError(null);

    try {
      await PlaylistService.deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete playlist';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user?.id]);

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    refreshPlaylists: fetchPlaylists,
  };
}

