import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';
import { useVisibilityReset } from '@/hooks/useVisibilityReset';

export function usePublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const mountedRef = useRef(true);
  const LIMIT = 8;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPlaylists = async (pageNum: number, isLoadMore: boolean = false, search: string = searchQuery) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, count } = await PlaylistService.getPublicPlaylists(pageNum, LIMIT, search);

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
        if (!isLoadMore) setPlaylists([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPlaylists(1, false, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPlaylists(page + 1, true, searchQuery);
    }
  };

  return {
    playlists,
    loading,
    searchQuery,
    setSearchQuery,
    loadMore,
    hasMore,
    loadingMore
  };
}