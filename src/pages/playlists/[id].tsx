import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import BannerImage from '@/components/BannerImage';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistTrack } from '@/types/playlist';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylistDetails } from '@/hooks/playlists/usePlaylistDetails';
import ConfirmModal from '@/components/Modal/ConfirmModal';
import EditPlaylistModal from '@/components/Playlist/EditPlaylistModal';
import AddToPlaylistModal from '@/components/Playlist/AddToPlaylistModal';
import UserMenu from '@/components/Auth/UserMenu';
import SortableTrackItem from '@/components/Playlist/SortableTrackItem';
import Link from 'next/link';
import Loading from '@/components/Loading';
import { showToast } from '@/lib/toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Navbar from '@/components/Navbar';

export default function PlaylistPage() {
  const router = useRouter();
  const playlistId = router.isReady && typeof router.query.id === 'string' ? router.query.id : undefined;
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying, seekTo } = usePlayer();

  const {
    playlist,
    tracks,
    loading,
    error,
    isOwner,
    removeTrack,
    removeTracks,
    updatePlaylist,
    reorderTracks,
  } = usePlaylistDetails(playlistId);

  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return tracks.filter(track => {
      const titleMatch = track.title?.toLowerCase().includes(lowerQuery);
      const artistMatch = track.artist?.toLowerCase().includes(lowerQuery);
      return titleMatch || artistMatch;
    });
  }, [tracks, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleRemoveTrack = async () => {
    if (!removeConfirm) return;
    try {
      await removeTrack(removeConfirm);
      setRemoveConfirm(null);
    } catch (error) {
      showToast.error('Failed to remove track');
    }
  };

  const handleUpdatePlaylist = async (data: any) => {
    await updatePlaylist(data);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    try {
      await reorderTracks(active.id as string, over.id as string);
    } catch (err) {
      console.error('Error reordering tracks:', err);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTrackIds(new Set());
  };

  const toggleTrackSelection = (trackId: string) => {
    const newSelected = new Set(selectedTrackIds);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTrackIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTrackIds.size === tracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(tracks.map(t => t.video_id)));
    }
  };

  const handleLongPress = (trackId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedTrackIds(new Set([trackId]));
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedTrackIds.size === 0) return;

    setIsDeleting(true);
    try {
      await removeTracks(Array.from(selectedTrackIds));

      setIsSelectionMode(false);
      setSelectedTrackIds(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      showToast.error('Failed to remove tracks');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTrackIds.size === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handlePlayTrack = (track: PlaylistTrack) => {
    const playlistAsQueue = tracks.map(t => ({
      id: t.video_id,
      videoId: t.video_id,
      title: t.title,
      artist: t.artist || 'Unknown Artist',
      channel: t.artist || 'Unknown Artist',
      thumbnail: t.thumbnail_url || '',
      duration: t.duration || 0,
      viewCount: 0,
    }));

    playTrack({
      id: track.video_id,
      videoId: track.video_id,
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      channel: track.artist || 'Unknown Artist',
      thumbnail: track.thumbnail_url || '',
      duration: track.duration || 0,
      viewCount: 0,
    }, playlistAsQueue, {
      id: playlist!.id,
      name: playlist!.name
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-40 relative">
      {playlist?.banner_image_url && (
        <div className="absolute top-0 left-0 right-0 h-[50vh] max-h-[500px] z-0">
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-zinc-950/80 to-zinc-950 z-10" />
          <BannerImage
            src={playlist.banner_image_url}
            alt=""
          />
        </div>
      )}

      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {loading && !playlist && !error && (
            <div className="flex items-center justify-center py-16">
              <Loading text="Loading playlist..." />
            </div>
          )}

          {error && !playlist && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <p className="text-xl mb-4">{error}</p>
                <Link href="/playlists" className="text-blue-500 hover:underline">
                  Back to Playlists
                </Link>
              </div>
            </div>
          )}

          {playlist && (
            <div className="mb-6 md:mb-8 pt-20 md:pt-32">
              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="shrink-0">
                  {playlist.cover_image_url ? (
                    <img
                      src={playlist.cover_image_url}
                      alt={playlist.name}
                      className="w-full aspect-square md:w-52 md:h-52 rounded-lg object-cover shadow-2xl"
                    />
                  ) : (
                    <div className="w-full aspect-square md:w-52 md:h-52 rounded-lg bg-linear-to-br from-zinc-700 to-zinc-900 shadow-2xl flex items-center justify-center">
                      <svg className="w-16 md:w-20 h-16 md:h-20 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 md:pb-2">
                  <p className="text-xs md:text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 md:mb-3 shadow-black drop-shadow-md">Playlist</p>
                  <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 wrap-break-word shadow-black drop-shadow-lg">  {playlist.name}</h1>

                  {playlist.description && (
                    <p className="text-zinc-300 text-sm md:text-base mb-3 md:mb-4 line-clamp-3 md:line-clamp-2 shadow-black drop-shadow-md">{playlist.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap shadow-black drop-shadow-md">
                    {playlist.users && playlist.users.username && (
                      <>
                        <Link
                          href={`/u/${playlist.users.username}`}
                          className="font-semibold text-white hover:text-zinc-300 transition-colors hover:underline"
                        >
                          {playlist.users.display_name || playlist.users.username}
                        </Link>
                        <span className="text-zinc-500">•</span>
                      </>
                    )}
                    <span className="text-zinc-300">{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{playlist.is_public ? 'Public' : 'Private'}</span>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex-1 md:flex-none px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {playlist && tracks.length === 0 && !loading && !error && (
            <div className="text-center py-16">
              <p className="text-zinc-400 text-lg mb-4">No tracks in this playlist yet</p>
              <Link href="/search" className="text-blue-500 hover:underline">
                Browse music to add tracks
              </Link>
            </div>
          )}

          {playlist && tracks.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search in playlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600 transition-colors"
                />
              </div>
            </div>
          )}

          {playlist && tracks.length > 0 && (
            searchQuery ? (
              <div className="space-y-3">
                {filteredTracks.length > 0 ? (
                  filteredTracks.map((track, index) => {
                    const isCurrentTrack = currentTrack?.videoId === track.video_id;
                    const originalIndex = tracks.findIndex(t => t.video_id === track.video_id);
                    return (
                      <SortableTrackItem
                        key={track.video_id}
                        track={track}
                        index={originalIndex}
                        isCurrentTrack={isCurrentTrack}
                        isPlaying={isPlaying}
                        isOwner={!!isOwner}
                        onPlay={() => handlePlayTrack(track)}
                        onDoubleClick={() => seekTo(0)}
                        onRemove={() => setRemoveConfirm(track.video_id)}
                        disabled={true}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTrackIds.has(track.video_id)}
                        onToggleSelection={() => toggleTrackSelection(track.video_id)}
                        onLongPress={() => handleLongPress(track.video_id)}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    No tracks found matching "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tracks.map(t => t.video_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {tracks.map((track, index) => {
                      const isCurrentTrack = currentTrack?.videoId === track.video_id;
                      return (
                        <SortableTrackItem
                          key={track.video_id}
                          track={track}
                          index={index}
                          isCurrentTrack={isCurrentTrack}
                          isPlaying={isPlaying}
                          isOwner={!!isOwner}
                          onPlay={() => handlePlayTrack(track)}
                          onDoubleClick={() => seekTo(0)}
                          onRemove={() => setRemoveConfirm(track.video_id)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedTrackIds.has(track.video_id)}
                          onToggleSelection={() => toggleTrackSelection(track.video_id)}
                          onLongPress={() => handleLongPress(track.video_id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )
          )}
        </main>

        <ConfirmModal
          isOpen={removeConfirm !== null}
          onClose={() => setRemoveConfirm(null)}
          onConfirm={handleRemoveTrack}
          title="Remove Track"
          message="Are you sure you want to remove this track from the playlist?"
          confirmText="Remove"
          cancelText="Cancel"
          isDanger
        />

        <ConfirmModal
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={confirmBulkDelete}
          title="Remove Tracks"
          message={`Are you sure you want to remove ${selectedTrackIds.size} tracks from this playlist? This action cannot be undone.`}
          confirmText={isDeleting ? "Removing..." : "Remove All"}
          cancelText="Cancel"
          isDanger
        />

        <EditPlaylistModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdatePlaylist}
          playlist={playlist}
        />

        <AddToPlaylistModal
          isOpen={showAddToPlaylistModal}
          onClose={() => setShowAddToPlaylistModal(false)}
          tracks={tracks.filter(t => selectedTrackIds.has(t.video_id)).map(t => ({
            id: t.video_id,
            videoId: t.video_id,
            title: t.title,
            artist: t.artist || 'Unknown Artist',
            thumbnail: t.thumbnail_url || '/default-thumbnail.jpg',
            duration: t.duration || 0,
            channel: t.artist || 'Unknown Artist',
            viewCount: 0,
          }))}
        />

        {isSelectionMode && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-bottom-10 fade-in duration-300 w-auto">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-full shadow-2xl shadow-black/80 p-1.5 flex items-center gap-2 ring-1 ring-white/5">

              <div className="flex items-center gap-2 pl-3 pr-2 border-r border-zinc-800/50">
                <span className="flex items-center justify-center w-6 h-6 bg-white text-black text-xs font-bold rounded-full">
                  {selectedTrackIds.size}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title={selectedTrackIds.size === tracks.length ? 'Deselect All' : 'Select All'}
                >
                  {selectedTrackIds.size === tracks.length ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowAddToPlaylistModal(true)}
                  disabled={selectedTrackIds.size === 0}
                  className="p-2.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add to Playlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {isOwner && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedTrackIds.size === 0 || isDeleting}
                    className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {isDeleting ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <div className="w-px h-6 bg-zinc-800/50 mx-1" />

              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedTrackIds(new Set());
                }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
