import { useState } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';
import { useAsyncData } from '@/hooks/useAsyncData';

export function usePublicPlaylists() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playlists, loading } = useAsyncData<Playlist[]>({
    fetchFn: async () => {
      return await PlaylistService.getPublicPlaylists();
    },
    dependencies: [],
  });

  const filteredPlaylists = (playlists || []).filter(playlist => 
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
