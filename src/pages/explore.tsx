import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicPlaylists } from '@/hooks/playlists/usePublicPlaylists';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { useMemo, useState } from 'react';

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { playlists, loading, searchQuery, setSearchQuery, loadMore, hasMore, loadingMore } = usePublicPlaylists();
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const sortedPlaylists = useMemo(() => {
    const sorted = [...playlists];

    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'popular':
        return sorted.sort((a, b) => (b.track_count || 0) - (a.track_count || 0));
      default:
        return sorted;
    }
  }, [playlists, sortBy]);

  return (
    <div className="min-h-screen text-zinc-100 pb-24">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Explore Public Playlists</h1>
          <p className="text-zinc-400">Discover playlists created by the community</p>
        </div>
        <div className="mb-8 max-w-2xl">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
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

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3.5 rounded-lg font-medium transition-all flex items-center gap-2 ${showFilters
                ? 'bg-white text-black'
                : 'bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Sort by
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'recent'
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Recent</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSortBy('popular')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'popular'
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>Popular</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>Showing {sortedPlaylists.length} playlists</span>
                  {sortBy !== 'recent' && (
                    <button
                      onClick={() => setSortBy('recent')}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && playlists.length === 0 ? (
          <div className="text-center py-12">
            <Loading text="Loading playlists..." />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-zinc-400 mb-4">
              {searchQuery ? 'No playlists found matching your search' : 'No public playlists yet'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {sortBy !== 'recent' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Sorted by {sortBy === 'popular' ? 'popularity' : 'track count'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Showing {sortedPlaylists.length} results
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSortBy('recent')}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedPlaylists.map((playlist) => {
                const owner = playlist.users;
                const ownerUsername = owner?.username;
                const isNew = new Date(playlist.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

                return (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group relative"
                  >
                    {isNew && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="px-2 py-1 bg-green-500 text-black text-xs font-bold rounded-md shadow-lg">
                          NEW
                        </div>
                      </div>
                    )}
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

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}