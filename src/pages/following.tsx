import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { FollowerService } from '@/services/follower-service';
import UserMenu from '@/components/Auth/UserMenu';
import Loading from '@/components/Loading';

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const loadPlaylists = async () => {
      setLoading(true);
      try {
        const data = await FollowerService.getFollowingPlaylists(user.id);
        if (mounted) {
          setPlaylists(data);
        }
      } catch (err) {
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPlaylists();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (authLoading || !user) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-zinc-300 transition-colors mr-8">
              Ritmik
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/playlists" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                My Playlists
              </Link>
              <Link href="/following" className="text-sm font-medium text-white">
                Following
              </Link>
              <Link href="/explore" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Explore
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Following</h1>
          <p className="text-zinc-400">Playlists from people you follow</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loading text="Loading playlists..." />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-4">
              No playlists yet from people you follow
            </div>
            <Link href="/explore" className="text-blue-500 hover:underline">
              Explore public playlists
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlists.map((playlist) => {
              const owner = playlist.users;
              const ownerUsername = owner?.username;

              return (
                <Link
                  key={playlist.id}
                  href={`/playlists/${playlist.id}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
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
                  <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-white transition-colors">
                    {playlist.name}
                  </h3>
                  {ownerUsername && (
                    <p className="text-xs text-zinc-500 mb-2">
                      by{' '}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/u/${ownerUsername}`);
                        }}
                        className="hover:text-zinc-400 transition-colors hover:underline text-left"
                      >
                        {owner.display_name || ownerUsername}
                      </button>
                    </p>
                  )}
                  {playlist.description && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{playlist.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}