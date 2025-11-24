import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!playlistId) return;

    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);
        
        if (!foundPlaylist) {
          setError('Playlist not found');
          return;
        }

        if (!foundPlaylist.is_public && (!user || foundPlaylist.user_id !== user.id)) {
          setError('This playlist is private');
          return;
        }

        setPlaylist(foundPlaylist);
        const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);
        setTracks(playlistTracks);
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId, user]);

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
    error,
    isOwner,
    removeTrack,
    updatePlaylist,
    reorderTracks,
  };
}

