import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const userId = user?.id;
    
    if (!userId) {
      setPlaylists([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    fetchTimeoutRef.current = setTimeout(() => {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 5000);

    PlaylistService.getUserPlaylists(userId)
      .then(data => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setPlaylists(data);
          setError(null);
        }
      })
      .catch(err => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
        }
      })
      .finally(() => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    return undefined;
  }, [user?.id]);

  const createPlaylist = async (data: CreatePlaylistData) => {
    if (!user) throw new Error('User not authenticated');
    await PlaylistService.createPlaylist(user.id, data);
    const updated = await PlaylistService.getUserPlaylists(user.id);
    if (mountedRef.current) {
      setPlaylists(updated);
    }
  };

  const updatePlaylist = async (playlistId: string, data: Partial<CreatePlaylistData>) => {
    if (!user) throw new Error('User not authenticated');
    await PlaylistService.updatePlaylist(playlistId, data);
    const updated = await PlaylistService.getUserPlaylists(user.id);
    if (mountedRef.current) {
      setPlaylists(updated);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    await PlaylistService.deletePlaylist(playlistId);
    if (mountedRef.current) {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
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