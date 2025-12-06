import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PlaylistTrack } from '@/types/playlist';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylistDetails } from '@/hooks/playlists/usePlaylistDetails';
import ConfirmModal from '@/components/Playlist/ConfirmModal';
import EditPlaylistModal from '@/components/Playlist/EditPlaylistModal';
import UserMenu from '@/components/Auth/UserMenu';
import SortableTrackItem from '@/components/Playlist/SortableTrackItem';
import Link from 'next/link';
import Loading from '@/components/Loading';
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
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const {
    playlist,
    tracks,
    loading,
    error,
    isOwner,
    removeTrack,
    updatePlaylist,
    reorderTracks,
  } = usePlaylistDetails(playlistId);

  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    } catch (err) {
      console.error('Error removing track:', err);
      alert('Failed to remove track');
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
    }, playlistAsQueue);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-40">
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
          <div className="mb-6 md:mb-8">
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
                <p className="text-xs md:text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 md:mb-3">Playlist</p>
                <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 wrap-break-word">  {playlist.name}</h1>

                {playlist.description && (
                  <p className="text-zinc-300 text-sm md:text-base mb-3 md:mb-4 line-clamp-3 md:line-clamp-2">{playlist.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
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
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
          </div>
        )}

        {playlist && tracks.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg mb-4">No tracks in this playlist yet</p>
            <Link href="/" className="text-blue-500 hover:underline">
              Browse music to add tracks
            </Link>
          </div>
        )}

        {playlist && tracks.length > 0 && (
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
                      onRemove={() => setRemoveConfirm(track.video_id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
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

      <EditPlaylistModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdatePlaylist}
        playlist={playlist}
      />
    </div>
  );
}

