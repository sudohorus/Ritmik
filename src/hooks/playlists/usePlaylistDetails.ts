import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';
import { useAsyncData } from '@/hooks/useAsyncData';

interface PlaylistData {
  playlist: Playlist;
  tracks: PlaylistTrack[];
}

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAsyncData<PlaylistData | null>({
    fetchFn: async () => {
      if (!playlistId) return null;

      const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);

      if (!foundPlaylist) {
        throw new Error('Playlist not found');
      }

      if (!foundPlaylist.is_public && (!user || foundPlaylist.user_id !== user.id)) {
        throw new Error('This playlist is private');
      }

      const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);

      return {
        playlist: foundPlaylist,
        tracks: playlistTracks,
      };
    },
    dependencies: [playlistId, user?.id],
    enabled: !!playlistId,
    onError: (err) => setLocalError(err.message),
  });

  const removeTrack = async (videoId: string) => {
    if (!playlistId || !user) throw new Error('Not authorized');

    await PlaylistService.removeTrackFromPlaylist(playlistId, videoId);
    await refetch();
  };

  const updatePlaylist = async (updateData: Partial<CreatePlaylistData>) => {
    if (!playlistId || !user) throw new Error('Not authorized');

    const updated = await PlaylistService.updatePlaylist(playlistId, updateData);
    await refetch();
    return updated;
  };

  const reorderTracks = async (activeId: string, overId: string) => {
    if (!playlistId || !data) return;

    const oldIndex = data.tracks.findIndex((t) => t.video_id === activeId);
    const newIndex = data.tracks.findIndex((t) => t.video_id === overId);

    const newTracks = arrayMove(data.tracks, oldIndex, newIndex);

    try {
      await PlaylistService.reorderPlaylistTracks(
        playlistId,
        newTracks.map((t) => t.video_id)
      );
      await refetch();
    } catch (err) {
      console.error('Error reordering tracks:', err);
      throw err;
    }
  };

  const isOwner = user && data?.playlist && data.playlist.user_id === user.id;

  return {
    playlist: data?.playlist || null,
    tracks: data?.tracks || [],
    loading,
    error: localError || error?.message || null,
    isOwner,
    removeTrack,
    updatePlaylist,
    reorderTracks,
  };
}
