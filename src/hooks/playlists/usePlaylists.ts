import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { supabase } from '@/lib/supabase';
import { Playlist, CreatePlaylistData } from '@/types/playlist';
import { showToast } from '@/lib/toast';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingRef = useRef(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const LIMIT = 8;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const fetchPlaylists = async (pageNum: number, isLoadMore: boolean = false, searchQuery: string = search) => {
    const userId = user?.id;
    if (!userId) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, count } = await PlaylistService.getUserPlaylists(userId, pageNum, LIMIT, searchQuery);

      if (mountedRef.current) {
        if (isLoadMore) {
          setPlaylists(prev => [...prev, ...data]);
        } else {
          setPlaylists(data);
        }
        if (isLoadMore) {
          setHasMore((pageNum * LIMIT) < count);
        } else {
          setHasMore(data.length === LIMIT && count > LIMIT);
        }

        setPage(pageNum);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch playlists';
        setError(errorMsg);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setPlaylists([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchPlaylists(1, false, search);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user?.id, search]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPlaylists(page + 1, true, search);
    }
  };

  const createPlaylist = async (data: CreatePlaylistData & { token: string }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (isCreatingRef.current) {
      throw new Error('Please wait for the current operation to complete');
    }

    isCreatingRef.current = true;

    try {
      const { token, ...playlistData } = data;
      const response = await fetch('/api/playlists/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({ ...playlistData, token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create playlist');
      }

      await fetchPlaylists(1);
      showToast.success('Playlist created successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create playlist';
      showToast.error(message);
      throw err;
    } finally {
      isCreatingRef.current = false;
    }
  };

  const updatePlaylist = async (playlistId: string, data: Partial<CreatePlaylistData>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await PlaylistService.updatePlaylist(playlistId, data);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, ...data } : p));
      showToast.success('Playlist updated successfully');
    } catch (err) {
      showToast.error('Failed to update playlist');
      throw err;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      await PlaylistService.deletePlaylist(playlistId);

      if (mountedRef.current) {
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      }

      showToast.success('Playlist deleted successfully');
    } catch (err) {
      showToast.error('Failed to delete playlist');
      throw err;
    }
  };

  return {
    playlists,
    loading,
    loadingMore,
    hasMore,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    loadMore,
    search,
    setSearch,
  };
}