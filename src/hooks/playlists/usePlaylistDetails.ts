import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';
import { useVisibilityReset } from '@/hooks/useVisibilityReset';
import { showToast } from '@/lib/toast';

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user, session } = useAuth();
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

  const forceReset = useCallback(() => {
    if (loading && mountedRef.current) {
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

    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setError('Request timeout - please refresh the page');
      }
    }, 10000);

    const load = async () => {
      try {
        const [foundPlaylist, playlistTracks] = await Promise.all([
          PlaylistService.getPlaylistById(playlistId, user?.id),
          fetch(`/api/playlists/${playlistId}/tracks`, {
            headers: session?.access_token ? {
              'Authorization': `Bearer ${session.access_token}`
            } : undefined
          }).then(res => {
            if (!res.ok) throw new Error('Failed to fetch tracks');
            return res.json();
          })
        ]);

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

        if (!foundPlaylist.is_public) {
          if (!currentUserId) {
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            setLoading(false);
            return;
          }

          if (foundPlaylist.user_id !== currentUserId) {
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            setError('This playlist is private');
            setPlaylist(null);
            setTracks([]);
            setLoading(false);
            return;
          }
        }

        if (mountedRef.current && loadedIdRef.current === playlistId) {
          if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
          setPlaylist(foundPlaylist);
          setTracks(playlistTracks);
          setError(null);
        }
      } catch (err) {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        if (mountedRef.current && loadedIdRef.current === playlistId) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load playlist';
          setError(errorMsg);
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

    try {
      await PlaylistService.removeTrackFromPlaylist(playlistId, videoId);

      if (mountedRef.current) {
        setTracks(prev => prev.filter(t => t.video_id !== videoId));
      }

      showToast.success('Track removed from playlist');
    } catch (err) {
      showToast.error('Failed to remove track');
      throw err;
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