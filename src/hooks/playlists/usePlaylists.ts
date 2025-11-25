import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, CreatePlaylistData } from '@/types/playlist';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const userIdRef = useRef<string | null>(null);

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
      userIdRef.current = null;
      return;
    }

    if (userIdRef.current === userId) {
      return;
    }

    userIdRef.current = userId;
    setLoading(true);
    setError(null);

    PlaylistService.getUserPlaylists(userId)
      .then(data => {
        if (mountedRef.current && userIdRef.current === userId) {
          setPlaylists(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mountedRef.current && userIdRef.current === userId) {
          setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });
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
