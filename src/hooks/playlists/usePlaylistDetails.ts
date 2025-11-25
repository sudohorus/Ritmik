import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';
import { useRetryableLoader } from '@/hooks/useRetryableLoader';

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const loadPlaylist = useCallback(async () => {
    if (!playlistId) {
      throw new Error('Playlist ID is required');
    }

    const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);

    if (!foundPlaylist) {
      throw new Error('Playlist not found');
    }

    if (!foundPlaylist.is_public && (!user || foundPlaylist.user_id !== user.id)) {
      throw new Error('This playlist is private');
    }

    setPlaylist(foundPlaylist);
    const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);
    setTracks(playlistTracks);
  }, [playlistId, user?.id]);

  const { loading, error } = useRetryableLoader(loadPlaylist, {
    deps: [playlistId, user?.id],
    enabled: !!playlistId,
    stallMs: 6000,
    maxRetries: 3,
  });

  useEffect(() => {
    setLocalError(error?.message || null);
  }, [error]);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setTracks([]);
      setLocalError(null);
    }
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
      console.error('Error reordering tracks:', err);
      setTracks(tracks);
      throw err;
    }
  };

  const isOwner = user && playlist && playlist.user_id === user.id;

  return {
    playlist,
    tracks,
    loading,
    error: localError,
    isOwner,
    removeTrack,
    updatePlaylist,
    reorderTracks,
  };
}

