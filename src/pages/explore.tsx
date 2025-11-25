import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicPlaylists } from '@/hooks/playlists/usePublicPlaylists';
import UserMenu from '@/components/Auth/UserMenu';
import Loading from '@/components/Loading';

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { playlists: filteredPlaylists, loading, searchQuery, setSearchQuery } = usePublicPlaylists();

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
                <Link href="/playlists" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  My Playlists
                </Link>
                <Link href="/explore" className="text-sm font-medium text-white">
                  Explore
                </Link>
              </nav>
            )}
          </div>
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Explore Public Playlists</h1>
          <p className="text-zinc-400">Discover playlists created by the community</p>
        </div>

        <div className="mb-8 max-w-2xl">
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playlists..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loading text="Loading playlists..." />
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-4">
              {searchQuery ? 'No playlists found matching your search' : 'No public playlists yet'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlaylists.map((playlist) => {
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
                  <div className="text-xs text-zinc-500">
                    {playlist.track_count || 0} {playlist.track_count === 1 ? 'track' : 'tracks'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

