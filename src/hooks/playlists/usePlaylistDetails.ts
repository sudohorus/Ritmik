import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist, PlaylistTrack, CreatePlaylistData } from '@/types/playlist';
import { arrayMove } from '@dnd-kit/sortable';

export function usePlaylistDetails(playlistId: string | undefined) {
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setTracks([]);
      setLocalError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setLocalError(null);

    const loadPlaylist = async () => {
      try {
        const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);

        if (!foundPlaylist) {
          throw new Error('Playlist not found');
        }

        if (!foundPlaylist.is_public && (!user || foundPlaylist.user_id !== user.id)) {
          throw new Error('This playlist is private');
        }

        if (!active) return;

        setPlaylist(foundPlaylist);
        const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);
        
        if (!active) return;
        
        setTracks(playlistTracks);
      } catch (err) {
        if (!active) return;
        setLocalError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPlaylist();

    return () => {
      active = false;
    };
  }, [playlistId, user?.id]);

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

