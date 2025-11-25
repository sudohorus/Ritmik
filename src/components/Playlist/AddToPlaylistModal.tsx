import { useState, useEffect } from 'react';
import { usePlaylists } from '@/hooks/playlists/usePlaylists';
import { PlaylistService } from '@/services/playlist-service';
import { Track } from '@/types/track';
import { PlaylistTrack } from '@/types/playlist';
import Loading from '@/components/Loading';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export default function AddToPlaylistModal({ isOpen, onClose, track }: AddToPlaylistModalProps) {
  const { playlists, loading: loadingPlaylists } = usePlaylists();
  const [loading, setLoading] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, PlaylistTrack[]>>({});

  useEffect(() => {
    if (!isOpen || playlists.length === 0) return;

    let active = true;

    const fetchAllPlaylistTracks = async () => {
      const tracksMap: Record<string, PlaylistTrack[]> = {};
      
      await Promise.all(
        playlists.map(async (playlist) => {
          try {
            const tracks = await PlaylistService.getPlaylistTracks(playlist.id);
            tracksMap[playlist.id] = tracks;
          } catch (err) {
            console.error(`Failed to fetch tracks for playlist ${playlist.id}:`, err);
            tracksMap[playlist.id] = [];
          }
        })
      );

      if (active) {
        setPlaylistTracks(tracksMap);
      }
    };

    fetchAllPlaylistTracks();

    return () => {
      active = false;
    };
  }, [isOpen, playlists]);

  const isTrackInPlaylist = (playlistId: string): boolean => {
    if (!track) return false;
    const tracks = playlistTracks[playlistId] || [];
    return tracks.some(t => t.video_id === track.videoId);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track || addingTo === playlistId) return;

    if (isTrackInPlaylist(playlistId)) {
      setError('This track is already in the playlist');
      return;
    }

    let active = true;

    setLoading(true);
    setAddingTo(playlistId);
    setError(null);
    setSuccess(false);

    try {
      await PlaylistService.addTrackToPlaylist({
        playlist_id: playlistId,
        track_id: track.videoId,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
      });
      
      if (!active) return;

      setPlaylistTracks(prev => ({
        ...prev,
        [playlistId]: [
          ...(prev[playlistId] || []),
          {
            id: track.videoId,
            playlist_id: playlistId,
            video_id: track.videoId,
            title: track.title,
            artist: track.artist,
            thumbnail_url: track.thumbnail,
            duration: track.duration,
            position: (prev[playlistId] || []).length,
            added_at: new Date().toISOString(),
          }
        ]
      }));
      
      setSuccess(true);
      setTimeout(() => {
        if (active) {
          onClose();
          setSuccess(false);
        }
      }, 1500);
    } catch (err) {
      if (active) {
        setError(err instanceof Error ? err.message : 'Failed to add track');
      }
    } finally {
      if (active) {
        setLoading(false);
        setAddingTo(null);
      }
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="bg-zinc-900 rounded-lg p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-950/50 border border-green-900/50 rounded-lg text-green-400 text-sm">
              Track added successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {loadingPlaylists ? (
            <div className="text-center py-8">
              <Loading size="sm" text="Loading playlists..." />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">You don&apos;t have any playlists yet</p>
              <p className="text-sm text-zinc-500">Create your first playlist to add tracks</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playlists.map((playlist) => {
                const alreadyAdded = isTrackInPlaylist(playlist.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={loading || alreadyAdded || addingTo === playlist.id}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      alreadyAdded
                        ? 'bg-zinc-800/50 cursor-not-allowed opacity-60'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-sm text-zinc-400 mt-1 truncate">{playlist.description}</p>
                        )}
                      </div>
                      {alreadyAdded && (
                        <span className="text-xs text-green-500 ml-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Added
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

