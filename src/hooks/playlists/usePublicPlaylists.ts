import { useState, useEffect, useRef } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);

    PlaylistService.getPublicPlaylists()
      .then(data => {
        if (mountedRef.current) {
          setPlaylists(data);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setPlaylists([]);
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });
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
