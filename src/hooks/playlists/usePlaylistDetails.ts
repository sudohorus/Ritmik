import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';
import { useVisibilityReset } from '@/hooks/useVisibilityReset';

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadedIdRef = useRef<string | null>(null);
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

  // ✅ Reset forçado quando volta do alt+tab
  const forceReset = useCallback(() => {
    console.log('[usePlaylistDetails] Force reset triggered');
    if (loading && mountedRef.current) {
      console.log('[usePlaylistDetails] Resetting stuck loading state');
      setLoading(false);
    }
  }, [loading]);

  useVisibilityReset(forceReset);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setTracks([]);
      setError(null);
      setLoading(false);
      loadedIdRef.current = null;
      return;
    }

    if (loadedIdRef.current === playlistId && playlist) {
      setLoading(false);
      return;
    }

    loadedIdRef.current = playlistId;
    setLoading(true);
    setError(null);

    // Safety timeout
    fetchTimeoutRef.current = setTimeout(() => {
      console.warn('[usePlaylistDetails] ⚠️ SAFETY TIMEOUT');
      if (mountedRef.current) {
        setLoading(false);
        setError('Request timeout - please refresh the page');
      }
    }, 5000);

    const load = async () => {
      try {
        const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);

        if (!mountedRef.current || loadedIdRef.current !== playlistId) {
          if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
          return;
        }

        if (!foundPlaylist) {
          if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
          setError('Playlist not found');
          setPlaylist(null);
          setTracks([]);
          setLoading(false);
          return;
        }

        const currentUserId = user?.id;
        if (!foundPlaylist.is_public && (!currentUserId || foundPlaylist.user_id !== currentUserId)) {
          if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
          setError('This playlist is private');
          setPlaylist(null);
          setTracks([]);
          setLoading(false);
          return;
        }

        const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);

        if (mountedRef.current && loadedIdRef.current === playlistId) {
          if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
          setPlaylist(foundPlaylist);
          setTracks(playlistTracks);
          setError(null);
        }
      } catch (err) {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        if (mountedRef.current && loadedIdRef.current === playlistId) {
          setError(err instanceof Error ? err.message : 'Failed to load playlist');
          setPlaylist(null);
          setTracks([]);
        }
      } finally {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [playlistId, user?.id]);

  const removeTrack = async (videoId: string) => {
    if (!playlistId || !user) throw new Error('Not authorized');
    await PlaylistService.removeTrackFromPlaylist(playlistId, videoId);
    if (mountedRef.current) {
      setTracks(prev => prev.filter(t => t.video_id !== videoId));
    }
  };

  const updatePlaylist = async (data: Partial<CreatePlaylistData>) => {
    if (!playlistId || !user) throw new Error('Not authorized');
    const updated = await PlaylistService.updatePlaylist(playlistId, data);
    if (mountedRef.current) {
      setPlaylist(updated);
    }
    return updated;
  };

  const reorderTracks = async (activeId: string, overId: string) => {
    if (!playlistId) return;

    const oldIndex = tracks.findIndex((t) => t.video_id === activeId);
    const newIndex = tracks.findIndex((t) => t.video_id === overId);
    const newTracks = arrayMove(tracks, oldIndex, newIndex);
    
    setTracks(newTracks);

    try {
      await PlaylistService.reorderPlaylistTracks(
        playlistId,
        newTracks.map((t) => t.video_id)
      );
    } catch (err) {
      if (mountedRef.current) {
        setTracks(tracks);
      }
      throw err;
    }
  };

  const isOwner = user && playlist && playlist.user_id === user.id;

  return {
    playlist,
    tracks,
    loading,
    error,
    isOwner,
    removeTrack,
    updatePlaylist,
    reorderTracks,
  };
}