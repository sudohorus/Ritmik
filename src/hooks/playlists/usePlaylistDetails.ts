import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const loadedPlaylistIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const userIdRef = useRef<string | undefined>(user?.id);
  
  userIdRef.current = user?.id;

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setTracks([]);
      setError(null);
      setLoading(false);
      hasLoadedRef.current = false;
      loadedPlaylistIdRef.current = null;
      return;
    }

    if (loadedPlaylistIdRef.current === playlistId && hasLoadedRef.current) {
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    let cancelled = false;
    isLoadingRef.current = true;
    
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);

        if (cancelled) {
          isLoadingRef.current = false;
          return;
        }

        if (!foundPlaylist) {
          setError('Playlist not found');
          setPlaylist(null);
          setTracks([]);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        const currentUserId = userIdRef.current;
        if (!foundPlaylist.is_public && (!currentUserId || foundPlaylist.user_id !== currentUserId)) {
          setError('This playlist is private');
          setPlaylist(null);
          setTracks([]);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);

        if (!cancelled) {
          setPlaylist(foundPlaylist);
          setTracks(playlistTracks);
          setError(null);
          setLoading(false);
          hasLoadedRef.current = true;
          loadedPlaylistIdRef.current = playlistId;
          isLoadingRef.current = false;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load playlist');
          if (!hasLoadedRef.current) {
            setPlaylist(null);
            setTracks([]);
          }
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      isLoadingRef.current = false;
    };
  }, [playlistId]);

  const removeTrack = async (videoId: string) => {
    if (!playlistId || !user) throw new Error('Not authorized');
    await PlaylistService.removeTrackFromPlaylist(playlistId, videoId);
    setTracks(prev => prev.filter(t => t.video_id !== videoId));
  };

  const updatePlaylist = async (data: Partial<CreatePlaylistData>) => {
    if (!playlistId || !user) throw new Error('Not authorized');
    const updated = await PlaylistService.updatePlaylist(playlistId, data);
    setPlaylist(updated);
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
      setTracks(tracks);
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
