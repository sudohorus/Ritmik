import { useTracks } from '@/hooks/tracks/useTracks';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import UserMenu from '@/components/Auth/UserMenu';
import Navbar from '@/components/Navbar';
import { useEffect, useRef } from 'react';
import { showToast } from '@/lib/toast';

export default function Home() {
  const router = useRouter();
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

  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const showTracks = displayTracks.length > 0;
  const showEmpty = !loading && !showTracks && !error;
  const isTrendingLoading = loading && viewMode === 'trending';

  const searchedPlayIdRef = useRef<string | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const playId = router.query.play as string;

    if (playId && playId !== searchedPlayIdRef.current) {
      searchedPlayIdRef.current = playId;
      hasPlayedRef.current = false;
      search(playId);
    } else if (!playId && !displayTracks.length && !loading && viewMode === 'trending') {
      fetchTrending();
    }
  }, [router.query.play, displayTracks.length, loading, viewMode, fetchTrending, search]);

  useEffect(() => {
    const playId = router.query.play as string;

    if (playId && displayTracks.length > 0 && viewMode === 'search' && !hasPlayedRef.current) {
      const trackToPlay = displayTracks.find(t => t.videoId === playId);

      if (trackToPlay) {
        hasPlayedRef.current = true;
        playTrack(trackToPlay, displayTracks);
        showToast.success('Playing shared track');
        router.replace('/', undefined, { shallow: true });
      }
    }
  }, [displayTracks, viewMode, playTrack, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="w-full sm:flex-1">
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

        {showEmpty && (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title="Start discovering music"
            description="Search for your favorite artists, songs, or albums to get started. Try searching for something you love!"
            action={{
              label: "Explore Playlists",
              onClick: () => router.push('/explore')
            }}
          />
        )}
      </main>
    </div>
  );
}
