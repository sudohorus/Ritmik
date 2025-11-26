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
    console.log('[usePlaylists] Hook mounted');
    
    return () => {
      console.log('[usePlaylists] Hook unmounting');
      mountedRef.current = false;
      // ✅ NÃO cancelar o timeout - deixar o fetch completar
      // if (fetchTimeoutRef.current) {
      //   clearTimeout(fetchTimeoutRef.current);
      // }
    };
  }, []);

  useEffect(() => {
    const userId = user?.id;
    
    console.log('[usePlaylists] useEffect triggered - userId:', userId);
    
    if (!userId) {
      console.log('[usePlaylists] No user, clearing playlists');
      setPlaylists([]);
      setLoading(false);
      setError(null);
      return;
    }

    // ✅ Se já está fazendo fetch, não iniciar outro
    if (isFetchingRef.current) {
      console.log('[usePlaylists] Already fetching, skipping');
      return;
    }

    console.log('[usePlaylists] Starting fetch for user:', userId);
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    // Safety timeout
    fetchTimeoutRef.current = setTimeout(() => {
      console.warn('[usePlaylists] ⚠️ SAFETY TIMEOUT');
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 5000);

    PlaylistService.getUserPlaylists(userId)
      .then(data => {
        console.log('[usePlaylists] ✅ Fetch successful, got', data.length, 'playlists');
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setPlaylists(data);
          setError(null);
        }
      })
      .catch(err => {
        console.error('[usePlaylists] ❌ Fetch error:', err);
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
        }
      })
      .finally(() => {
        console.log('[usePlaylists] Fetch complete, setting loading = false');
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    // ✅ NÃO retornar cleanup que cancela o fetch
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

  console.log('[usePlaylists] Rendering - loading:', loading, 'playlists:', playlists.length, 'isFetching:', isFetchingRef.current);

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  };
}