import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { usePlaylists } from '@/hooks/playlists/usePlaylists';
import CreatePlaylistModal from '@/components/Playlist/CreatePlaylistModal';
import ConfirmModal from '@/components/Playlist/ConfirmModal';
import UserMenu from '@/components/Auth/UserMenu';
import Loading from '@/components/Loading';

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { playlists, loading, createPlaylist, deletePlaylist } = usePlaylists();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  const handleCreate = async (data: { name: string; description?: string; is_public?: boolean; cover_image_url?: string }) => {
    await createPlaylist(data);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deletePlaylist(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-zinc-300 transition-colors mr-8">
              Ritmik
            </Link>
            {user && (
              <nav className='flex items-center gap-6'>
                <Link href="/playlists" className="text-sm font-medium text-white hover:text-white transition-colors">
                  My Playlists
                </Link>
                <Link href="/following" className="text-sm font-medium text-zinc-400">
                Following
                </Link>
                <Link href="/explore" className="text-sm font-medium text-zinc-400">
                  Explore
                </Link>
              </nav>
            )}
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-3">My Playlists</h1>
            <p className="text-zinc-400">Manage your music collections</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Playlist
          </button>
        </div>

        {loading && playlists.length === 0 ? (
          <div className="text-center py-12">
            <Loading text="Loading playlists..." />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-4">You don&apos;t have any playlists yet</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
            >
              Create your first playlist
            </button>
          </div>
        ) : (
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
    </div>
  );
}

