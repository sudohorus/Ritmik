import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchPlaylists = useCallback(async (userId: string, fetchId: number) => {
    try {
      const data = await PlaylistService.getUserPlaylists(userId);
      if (fetchIdRef.current === fetchId) {
        setPlaylists(data);
        setError(null);
      }
    } catch (err) {
      if (fetchIdRef.current === fetchId) {
        setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
      }
    } finally {
      if (fetchIdRef.current === fetchId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const userId = user?.id;
    
    if (!userId) {
      setPlaylists([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    
    fetchPlaylists(userId, fetchId);
  }, [user?.id, fetchPlaylists]);

  const createPlaylist = async (data: CreatePlaylistData) => {
    if (!user) throw new Error('User not authenticated');
    await PlaylistService.createPlaylist(user.id, data);
    const updated = await PlaylistService.getUserPlaylists(user.id);
    setPlaylists(updated);
  };

  const updatePlaylist = async (playlistId: string, data: Partial<CreatePlaylistData>) => {
    if (!user) throw new Error('User not authenticated');
    await PlaylistService.updatePlaylist(playlistId, data);
    const updated = await PlaylistService.getUserPlaylists(user.id);
    setPlaylists(updated);
  };

  const deletePlaylist = async (playlistId: string) => {
    await PlaylistService.deletePlaylist(playlistId);
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
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
