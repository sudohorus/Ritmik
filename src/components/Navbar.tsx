import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/Auth/UserMenu';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  return (
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
            <nav className="flex items-center gap-6">
              <Link 
                href="/playlists" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/playlists') 
                    ? 'text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                My Playlists
              </Link>
              <Link 
                href="/following" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/following') 
                    ? 'text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Following
              </Link>
              <Link 
                href="/explore" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/explore') 
                    ? 'text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Explore
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
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
  );
}