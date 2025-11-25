import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.display_name || user.username || user.email?.split('@')[0] || 'User';
  const avatarLetter = (user.username || user.email || 'U')[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700/50"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover shadow-lg border border-zinc-600"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-sm shadow-lg border border-zinc-600">
            {avatarLetter}
          </div>
        )}
        <span className="text-sm font-medium text-white hidden sm:block">{displayName}</span>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
          
          {user.username && (
            <Link
              href={`/u/${user.username}`}
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Profile
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
          
          <button
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
