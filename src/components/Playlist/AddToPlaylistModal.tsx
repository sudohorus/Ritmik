import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlaylists } from '@/hooks/playlists/usePlaylists';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistService } from '@/services/playlist-service';
import { Track } from '@/types/track';
import { PlaylistTrack } from '@/types/playlist';
import Loading from '@/components/Loading';
import { showToast } from '@/lib/toast';
import CreatePlaylistModal from './CreatePlaylistModal';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
}

export default function AddToPlaylistModal({ isOpen, onClose, tracks }: AddToPlaylistModalProps) {
  const { user } = useAuth();
  const { playlists, loading: loadingPlaylists, loadMore, hasMore, loadingMore, search, setSearch, createPlaylist } = usePlaylists();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingTrackCounts, setExistingTrackCounts] = useState<Record<string, number>>({});
  const [loadingChecks, setLoadingChecks] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const processingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) {
      setExistingTrackCounts({});
      setLoadingChecks({});
      setAddingTo(null);
      setError(null);
      setSearch('');
      processingRef.current = {};
    }
  }, [isOpen, tracks, setSearch]);

  const checkPlaylist = useCallback(async (playlistId: string): Promise<number> => {
    if (tracks.length === 0) return 0;

    if (existingTrackCounts[playlistId] !== undefined) {
      return existingTrackCounts[playlistId];
    }

    setLoadingChecks(prev => ({ ...prev, [playlistId]: true }));

    try {
      const playlistTracks = await PlaylistService.getPlaylistTracks(playlistId, user?.id);
      const existingCount = tracks.filter(t => playlistTracks.some((pt: PlaylistTrack) => pt.video_id === t.videoId)).length;

      setExistingTrackCounts(prev => ({ ...prev, [playlistId]: existingCount }));
      setLoadingChecks(prev => ({ ...prev, [playlistId]: false }));

      return existingCount;
    } catch (err) {
      console.error(`Failed to check playlist ${playlistId}:`, err);
      setExistingTrackCounts(prev => ({ ...prev, [playlistId]: 0 }));
      setLoadingChecks(prev => ({ ...prev, [playlistId]: false }));
      return 0;
    }
  }, [tracks, existingTrackCounts, user?.id]);

  useEffect(() => {
    if (isOpen && playlists.length > 0 && tracks.length > 0) {
      playlists.slice(0, 5).forEach(playlist => {
        if (!(playlist.id in existingTrackCounts) && !loadingChecks[playlist.id]) {
          checkPlaylist(playlist.id);
        }
      });
    }
  }, [isOpen, playlists, tracks, checkPlaylist, existingTrackCounts, loadingChecks]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (tracks.length === 0 || processingRef.current[playlistId]) return;

    processingRef.current[playlistId] = true;
    setAddingTo(playlistId);
    setError(null);

    try {
      const existingCount = await checkPlaylist(playlistId);
      if (existingCount === tracks.length) {
        showToast.error('All tracks already in playlist');
        return;
      }

      const tracksToAdd = tracks.map(track => ({
        playlist_id: playlistId,
        track_id: track.videoId,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
      }));

      await PlaylistService.addTracksToPlaylist(playlistId, tracksToAdd);

      setExistingTrackCounts(prev => ({ ...prev, [playlistId]: tracks.length }));

      showToast.success(`${tracks.length} tracks added to playlist`);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add tracks';
      setError(errorMsg);
      showToast.error('Failed to add tracks');
    } finally {
      setAddingTo(null);
      processingRef.current[playlistId] = false;
    }
  };

  const handleCreatePlaylist = async (data: { name: string; description?: string; is_public?: boolean; cover_image_url?: string | null; banner_image_url?: string | null; token: string }) => {
    try {
      await createPlaylist(data);
      setShowCreateModal(false);
    } catch (err) {
      
    }
  };

  if (!isOpen || tracks.length === 0) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="bg-zinc-900 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {tracks.length > 1 ? `Add ${tracks.length} tracks to Playlist` : 'Add to Playlist'}
              </h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search playlists..."
                  className="w-full px-4 py-2.5 pl-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-500 italic">No existing playlists found</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {playlists.map((playlist) => {
                    const existingCount = existingTrackCounts[playlist.id] || 0;
                    const isChecking = loadingChecks[playlist.id];
                    const isAdding = addingTo === playlist.id;
                    const allIn = existingCount === tracks.length && tracks.length > 0;
                    const isDisabled = isAdding || allIn;

                    return (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        onMouseEnter={() => {
                          if (existingTrackCounts[playlist.id] === undefined && !loadingChecks[playlist.id]) {
                            checkPlaylist(playlist.id);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-full p-4 rounded-lg text-left transition-colors ${allIn
                          ? 'bg-zinc-800/50 cursor-not-allowed opacity-60'
                          : 'bg-zinc-800 hover:bg-zinc-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{playlist.name}</h3>
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
                          ) : existingCount > 0 ? (
                            <span className="text-xs text-zinc-400 ml-2 flex items-center gap-1">
                              {existingCount === tracks.length ? (
                                <span className="text-green-500 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  All Added
                                </span>
                              ) : (
                                <span>{existingCount}/{tracks.length} in playlist</span>
                              )}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2.5 mt-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full p-3 rounded-lg text-left bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-zinc-700 hover:border-zinc-600 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors border border-zinc-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200 group-hover:text-white transition-colors">Create New Playlist</h3>
                  <p className="text-xs text-zinc-500">Start a new playlist</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePlaylist}
      />
    </>
  );
}
