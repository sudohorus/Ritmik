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

export default function PlaylistPage() {
  const router = useRouter();
  const { id } = router.query;
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
  } = usePlaylistDetails(id as string);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please log in to view playlists</p>
          <Link href="/login" className="text-blue-500 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">{error || 'Playlist not found'}</p>
          <Link href="/playlists" className="text-blue-500 hover:underline">
            Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-32">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-zinc-300 transition-colors mr-8">
              Ritmik
            </Link>
              <nav className='flex items-center gap-6'>
                <Link href="/playlists" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  My Playlists
                </Link>
                <Link href="/explore" className="text-sm font-medium text-white">
                  Explore
                </Link>
              </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-4xl font-bold">{playlist.name}</h1>
            {isOwner && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
          {playlist.description && (
            <p className="text-zinc-400 text-lg">{playlist.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
            {playlist.users && (
              <>
                <span className="text-zinc-400">
                  by <span className="text-zinc-300 font-medium">{playlist.users.display_name || playlist.users.username}</span>
                </span>
                <span>•</span>
              </>
            )}
            <span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
            <span>•</span>
            <span>{playlist.is_public ? 'Public' : 'Private'}</span>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg mb-4">No tracks in this playlist yet</p>
            <Link href="/" className="text-blue-500 hover:underline">
              Browse music to add tracks
            </Link>
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

