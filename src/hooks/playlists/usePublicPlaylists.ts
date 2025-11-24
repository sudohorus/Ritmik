import { useState, useEffect } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPublicPlaylists();
  }, []);

  const fetchPublicPlaylists = async () => {
    try {
      setLoading(true);
      const publicPlaylists = await PlaylistService.getPublicPlaylists();
      setPlaylists(publicPlaylists);
    } catch (err) {
      console.error('Error fetching public playlists:', err);
    } finally {
      setLoading(false);
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

