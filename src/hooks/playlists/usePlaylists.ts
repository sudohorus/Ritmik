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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const isCreatingRef = useRef(false); 

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
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
        setError('Request timeout - please refresh the page');
      }
    }, 10000);

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
          const errorMsg = err instanceof Error ? err.message : 'Failed to fetch playlists';
          setError(errorMsg);
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
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (isCreatingRef.current) {
      throw new Error('Please wait for the current operation to complete');
    }

    isCreatingRef.current = true;

    try {
      await PlaylistService.createPlaylist(user.id, data);
      
      let retries = 3;
      let updated: Playlist[] | null = null;
      
      while (retries > 0 && !updated) {
        try {
          updated = await PlaylistService.getUserPlaylists(user.id);
          break;
        } catch (err) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw err;
          }
        }
      }
      
      if (mountedRef.current && updated) {
        setPlaylists(updated);
      }
    } catch (err) {
      throw err;
    } finally {
      isCreatingRef.current = false;
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