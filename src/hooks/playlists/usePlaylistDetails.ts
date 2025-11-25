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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setTracks([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setError('Request timeout');
      }
    }, 10000);

    const load = async () => {
      try {
        const foundPlaylist = await PlaylistService.getPlaylistById(playlistId);

        if (cancelled) return;

        if (!foundPlaylist) {
          if (!cancelled) {
            clearTimeout(timeout);
            setError('Playlist not found');
            setPlaylist(null);
            setTracks([]);
            setLoading(false);
          }
          return;
        }

        if (!foundPlaylist.is_public && (!user || foundPlaylist.user_id !== user.id)) {
          if (!cancelled) {
            clearTimeout(timeout);
            setError('This playlist is private');
            setPlaylist(null);
            setTracks([]);
            setLoading(false);
          }
          return;
        }

        const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId);

        if (!cancelled) {
          clearTimeout(timeout);
          setPlaylist(foundPlaylist);
          setTracks(playlistTracks);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          clearTimeout(timeout);
          setError(err instanceof Error ? err.message : 'Failed to load playlist');
          setPlaylist(null);
          setTracks([]);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
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
