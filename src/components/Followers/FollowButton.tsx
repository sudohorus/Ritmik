import { useFollowers } from '@/hooks/followers/useFollowers';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface FollowButtonProps {
  userId: string;
  username?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ userId, username, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const { stats, loading, actionLoading, toggleFollow } = useFollowers(userId);

  useEffect(() => {
    if (!loading && onFollowChange) {
      onFollowChange(stats.isFollowing);
    }
  }, [stats.isFollowing, loading]);

  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleFollow();
    } catch (err) {
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-2 rounded-lg bg-zinc-800 animate-pulse">
        <div className="h-5 w-20 bg-zinc-700 rounded" />
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={actionLoading}
      className={`px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
        stats.isFollowing
          ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
          : 'bg-white hover:bg-zinc-200 text-black'
      }`}
    >
      {actionLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{stats.isFollowing ? 'Unfollowing...' : 'Following...'}</span>
        </>
      ) : (
        <>
          {stats.isFollowing ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Following
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Follow
            </>
          )}
        </>
      )}
    </button>
  );
}