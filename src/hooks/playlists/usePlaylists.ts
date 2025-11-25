import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const userId = user?.id;
    
    if (!userId) {
      if (loadedUserIdRef.current !== null) {
        setPlaylists([]);
        setLoading(false);
        loadedUserIdRef.current = null;
      }
      return;
    }

    if (loadedUserIdRef.current === userId && playlists.length > 0) {
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    let cancelled = false;
    isLoadingRef.current = true;
    setLoading(true);

    PlaylistService.getUserPlaylists(userId)
      .then(data => {
        if (!cancelled) {
          setPlaylists(data);
          setLoading(false);
          loadedUserIdRef.current = userId;
          isLoadingRef.current = false;
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
          setLoading(false);
          isLoadingRef.current = false;
        }
      });

    return () => {
      cancelled = true;
      isLoadingRef.current = false;
    };
  }, [user?.id, playlists.length]);

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
