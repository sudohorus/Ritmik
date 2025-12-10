import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/Auth/UserMenu';

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight hover:text-zinc-300 transition-colors mr-8"
            >
              Ritmik
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/playlists"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/playlists')
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                >
                  My Playlists
                </Link>
                <Link
                  href="/following"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/following')
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                >
                  Following
                </Link>
                <Link
                  href="/explore"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/explore')
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                >
                  Explore
                </Link>
                <Link
                  href="/stats"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/stats')
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                >
                  Stats
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg font-medium transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="fixed bottom-0 inset-x-0 md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm z-20">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-around text-[11px] font-medium">
            <Link
              href="/playlists"
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${isActive('/playlists')
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400'
                }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 6h10M9 12h10M9 18h4M5 6h.01M5 12h.01M5 18h.01"
                />
              </svg>
              <span>Playlists</span>
            </Link>
            <Link
              href="/following"
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${isActive('/following')
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400'
                }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-1a6 6 0 00-9-5.197M9 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v2h9"
                />
              </svg>
              <span>Following</span>
            </Link>
            <Link
              href="/explore"
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${isActive('/explore')
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400'
                }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Explore</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}