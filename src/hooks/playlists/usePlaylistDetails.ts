import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchPlaylist = useCallback(async (id: string, userId: string | undefined, fetchId: number) => {
    try {
      const foundPlaylist = await PlaylistService.getPlaylistById(id);

      if (fetchIdRef.current !== fetchId) return;

      if (!foundPlaylist) {
        setError('Playlist not found');
        setPlaylist(null);
        setTracks([]);
        return;
      }

      if (!foundPlaylist.is_public && (!userId || foundPlaylist.user_id !== userId)) {
        setError('This playlist is private');
        setPlaylist(null);
        setTracks([]);
        return;
      }

      const playlistTracks = await PlaylistService.getPlaylistTracks(id);

      if (fetchIdRef.current !== fetchId) return;

      setPlaylist(foundPlaylist);
      setTracks(playlistTracks);
      setError(null);
    } catch (err) {
      if (fetchIdRef.current === fetchId) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
        setPlaylist(null);
        setTracks([]);
      }
    } finally {
      if (fetchIdRef.current === fetchId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setTracks([]);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    fetchPlaylist(playlistId, user?.id, fetchId);
  }, [playlistId, user?.id, fetchPlaylist]);

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
