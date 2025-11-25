import { useState, useEffect, useRef } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      setLoading(false);
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    let cancelled = false;
    isLoadingRef.current = true;
    
    setLoading(true);

    PlaylistService.getPublicPlaylists()
      .then(data => {
        if (!cancelled) {
          setPlaylists(data);
          setLoading(false);
          hasLoadedRef.current = true;
          isLoadingRef.current = false;
        }
      })
      .catch(err => {
        if (!cancelled) {
          setPlaylists([]);
          setLoading(false);
          isLoadingRef.current = false;
        }
      });

    return () => {
      cancelled = true;
      isLoadingRef.current = false;
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
