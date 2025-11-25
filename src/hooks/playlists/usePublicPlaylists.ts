import { useState, useEffect, useRef } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchPublicPlaylists();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPublicPlaylists = async () => {
    try {
      if (isMounted.current) {
        setLoading(true);
      }
      const publicPlaylists = await PlaylistService.getPublicPlaylists();
      if (isMounted.current) {
        setPlaylists(publicPlaylists);
      }
    } catch (err) {
      console.error('Error fetching public playlists:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    playlists: filteredPlaylists,
    loading,
    searchQuery,
    setSearchQuery,
    refreshPlaylists: fetchPublicPlaylists,
  };
}

