import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlaylists } from '@/hooks/playlists/usePlaylists';
import { PlaylistService } from '@/services/playlist-service';
import { Track } from '@/types/track';
import { PlaylistTrack } from '@/types/playlist';
import Loading from '@/components/Loading';
import { showToast } from '@/lib/toast';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export default function AddToPlaylistModal({ isOpen, onClose, track }: AddToPlaylistModalProps) {
  const { playlists, loading: loadingPlaylists } = usePlaylists();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedPlaylists, setCheckedPlaylists] = useState<Record<string, boolean>>({});
  const [loadingChecks, setLoadingChecks] = useState<Record<string, boolean>>({});
  const processingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) {
      setCheckedPlaylists({});
      setLoadingChecks({});
      setAddingTo(null);
      setError(null);
      processingRef.current = {};
    }
  }, [isOpen, track?.videoId]);

  const checkPlaylist = useCallback(async (playlistId: string): Promise<boolean> => {
    if (!track) return false;

    if (checkedPlaylists[playlistId] !== undefined) {
      return checkedPlaylists[playlistId];
    }

    setLoadingChecks(prev => ({ ...prev, [playlistId]: true }));

    try {
      const tracks = await PlaylistService.getPlaylistTracks(playlistId);
      const isInPlaylist = tracks.some((t: PlaylistTrack) => t.video_id === track.videoId);

      setCheckedPlaylists(prev => ({ ...prev, [playlistId]: isInPlaylist }));
      setLoadingChecks(prev => ({ ...prev, [playlistId]: false }));

      return isInPlaylist;
    } catch (err) {
      setLoadingChecks(prev => ({ ...prev, [playlistId]: false }));
      return false;
    }
  }, [track, checkedPlaylists]);

  useEffect(() => {
    if (isOpen && playlists.length > 0 && track) {
      playlists.slice(0, 5).forEach(playlist => {
        if (!(playlist.id in checkedPlaylists) && !loadingChecks[playlist.id]) {
          checkPlaylist(playlist.id);
        }
      });
    }
  }, [isOpen, playlists, track, checkPlaylist, checkedPlaylists, loadingChecks]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track || processingRef.current[playlistId]) return;

    processingRef.current[playlistId] = true;
    setAddingTo(playlistId);
    setError(null);

    try {
      const isAlreadyIn = await checkPlaylist(playlistId);
      if (isAlreadyIn) {
        showToast.error('Track already in playlist');
        return;
      }

      await PlaylistService.addTrackToPlaylist({
        playlist_id: playlistId,
        track_id: track.videoId,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
      });

      setCheckedPlaylists(prev => ({ ...prev, [playlistId]: true }));

      showToast.success('Track added to playlist');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add track';
      setError(errorMsg);
      showToast.error('Failed to add track');
    } finally {
      setAddingTo(null);
      processingRef.current[playlistId] = false;
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
                const alreadyAdded = checkedPlaylists[playlist.id] === true;
                const isChecking = loadingChecks[playlist.id];
                const isAdding = addingTo === playlist.id;
                const isDisabled = isAdding || alreadyAdded;

                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    onMouseEnter={() => {
                      if (checkedPlaylists[playlist.id] === undefined && !loadingChecks[playlist.id]) {
                        checkPlaylist(playlist.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${alreadyAdded
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
                      {isAdding ? (
                        <div className="ml-2">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : isChecking ? (
                        <span className="text-xs text-zinc-500 ml-2">Checking...</span>
                      ) : alreadyAdded ? (
                        <span className="text-xs text-green-500 ml-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Added
                        </span>
                      ) : null}
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


