import { useState, useEffect } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    
    setLoading(true);

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 10000);

    PlaylistService.getPublicPlaylists()
      .then(data => {
        if (!cancelled) {
          clearTimeout(timeout);
          setPlaylists(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          clearTimeout(timeout);
          console.error('Error fetching public playlists:', err);
          setPlaylists([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
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
