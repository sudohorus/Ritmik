import { useTracks } from '@/hooks/tracks/useTracks';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  const { 
    loading, 
    error, 
    displayTracks, 
    listTitle, 
    viewMode,
    hasMore,
    fetchTrending, 
    search,
    loadMore
  } = useTracks();

  const showTracks = displayTracks.length > 0;
  const showEmpty = !loading && !showTracks && !error;
  const isTrendingLoading = loading && viewMode === 'trending';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold tracking-tight">Ritmik</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={fetchTrending}
              disabled={loading}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500 border border-zinc-700 rounded-lg transition-all font-medium"
            >
              {isTrendingLoading ? 'Loading...' : 'Trending'}
            </button>
            
            <div className="flex-1">
              <SearchBar onSearch={search} loading={loading} />
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        
        {showTracks && (
          <>
            <TrackList tracks={displayTracks} title={listTitle} />
            
            {hasMore && viewMode === 'search' && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500 border border-zinc-700 rounded-lg transition-all font-medium"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
        
        {showEmpty && <EmptyState />}
      </main>
    </div>
  );
}
