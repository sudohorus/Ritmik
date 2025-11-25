import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchIdRef = useRef(0);

  const fetchPlaylists = useCallback(async (fetchId: number) => {
    try {
      const data = await PlaylistService.getPublicPlaylists();
      if (fetchIdRef.current === fetchId) {
        setPlaylists(data);
      }
    } catch {
      if (fetchIdRef.current === fetchId) {
        setPlaylists([]);
      }
    } finally {
      if (fetchIdRef.current === fetchId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    fetchPlaylists(fetchId);
  }, [fetchPlaylists]);

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    playlists: filteredPlaylists,
    loading,
    searchQuery,
    setSearchQuery,
  };
}
