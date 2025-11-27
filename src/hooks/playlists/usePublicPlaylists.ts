import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';
import { useVisibilityReset } from '@/hooks/useVisibilityReset';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const forceReset = useCallback(() => {
    if (loading && mountedRef.current) {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [loading]);

  useVisibilityReset(forceReset);

  useEffect(() => {
    if (hasLoadedRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    }, 5000);

    PlaylistService.getPublicPlaylists()
      .then(data => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        if (mountedRef.current) {
          setPlaylists(data);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        if (mountedRef.current) {
          setPlaylists([]);
          hasLoadedRef.current = true;
        }
      })
      .finally(() => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

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