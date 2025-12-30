import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { usePlaylists } from '@/hooks/playlists/usePlaylists';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import CreatePlaylistModal from '@/components/Playlist/CreatePlaylistModal';
import ConfirmModal from '@/components/Playlist/ConfirmModal';
import IntegrationsModal from '@/components/Modals/IntegrationsModal';
import YoutubeImportModal from '@/components/Youtube/YoutubeImportModal';
import UserMenu from '@/components/Auth/UserMenu';
import Loading from '@/components/Loading';
import Navbar from '@/components/Navbar';
import EmptyState from '@/components/EmptyState';

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { playlists, loading, createPlaylist, deletePlaylist, loadMore, hasMore, loadingMore, search, setSearch } = usePlaylists();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadMoreRef = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: hasMore && !loadingMore,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  const handleCreate = async (data: { name: string; description?: string; is_public?: boolean; cover_image_url?: string; banner_image_url?: string; token: string }) => {
    await createPlaylist(data);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deletePlaylist(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 pb-40">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">My Playlists</h1>
            <p className="text-sm md:text-base text-zinc-400">Manage your music collections</p>
          </div>
          <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowIntegrationsModal(true)}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export from
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Playlist
            </button>
          </div>
        </div>

        {loading && playlists.length === 0 ? (
          <div className="text-center py-12">
            <Loading text="Loading playlists..." />
          </div>
        ) : playlists.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            }
            title="Create your first playlist"
            description="Organize your favorite tracks into playlists. Search for music and start building your collection!"
            action={{
              label: "Create Playlist",
              onClick: () => setShowCreateModal(true)
            }}
            secondaryAction={{
              label: "Explore Music",
              onClick: () => router.push('/')
            }}
          />
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group flex flex-col"
                >
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {playlist.cover_image_url ? (
                      <img
                        src={playlist.cover_image_url}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 truncate group-hover:text-white transition-colors">
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2 grow min-h-10">
                    {playlist.description || '\u00A0'}
                  </p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Link
                      href={`/playlists/${playlist.id}`}
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors text-center"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(playlist.id)}
                      className="px-4 py-2 bg-red-950/50 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-900/50"
                      title="Delete playlist"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center pt-4 h-20 items-center"
              >
                {loadingMore && <Loading size="sm" text="Loading more..." />}
              </div>
            )}
          </div>
        )}
      </main>

      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger
      />

      <IntegrationsModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        onSelectYoutube={() => setShowYoutubeModal(true)}
      />

      {showYoutubeModal && (
        <YoutubeImportModal onClose={() => setShowYoutubeModal(false)} />
      )}
    </div>
  );
}

