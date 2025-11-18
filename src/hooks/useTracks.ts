import { useState } from 'react';
import { Track } from '@/types/track';
import { TrackService } from '@/services/track-service';

type ViewMode = 'trending' | 'search';

export function useTracks() {
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('trending');
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [lastQuery, setLastQuery] = useState('');

  const fetchTrending = async () => {
    setLoading(true);
    setError('');
    setViewMode('trending');

    try {
      const response = await TrackService.getTrending();
      setTracks(response.data || []);
      setHasMore(false);
      setNextPageToken(undefined);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const search = async (query: string, append: boolean = false) => {
    setLoading(true);
    setError('');
    
    if (!append) {
      setViewMode('search');
      setSearchResults([]);
      setLastQuery(query);
      setNextPageToken(undefined);
    }

    try {
      const response = await TrackService.search(
        query, 
        append ? nextPageToken : undefined
      );
      const newResults = response.data || [];
      
      if (append) {
        const existingIds = new Set(searchResults.map(t => t.videoId));
        const uniqueNewResults = newResults.filter(t => !existingIds.has(t.videoId));
        setSearchResults(prev => [...prev, ...uniqueNewResults]);
      } else {
        setSearchResults(newResults);
      }
      
      setNextPageToken(response.nextPageToken);
      setHasMore(response.hasMore || false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (lastQuery && !loading && hasMore && nextPageToken) {
      search(lastQuery, true);
    }
  };

  const displayTracks = viewMode === 'trending' ? tracks : searchResults;
  const listTitle = viewMode === 'trending' 
    ? 'Trending Tracks' 
    : `Search Results (${displayTracks.length})`;

  return {
    loading,
    error,
    displayTracks,
    listTitle,
    viewMode,
    hasMore,
    fetchTrending,
    search,
    loadMore
  };
}

