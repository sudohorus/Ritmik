import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    PlaylistService.getUserPlaylists(user.id)
      .then(data => {
        if (!cancelled) {
          setPlaylists(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const createPlaylist = async (data: CreatePlaylistData) => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    try {
      await PlaylistService.createPlaylist(user.id, data);
      const updated = await PlaylistService.getUserPlaylists(user.id);
      setPlaylists(updated);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const updatePlaylist = async (playlistId: string, data: Partial<CreatePlaylistData>) => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    try {
      await PlaylistService.updatePlaylist(playlistId, data);
      const updated = await PlaylistService.getUserPlaylists(user.id);
      setPlaylists(updated);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    setLoading(true);
    try {
      await PlaylistService.deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  };
}
