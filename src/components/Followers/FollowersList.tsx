import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FollowerService, FollowerUser } from '@/services/follower-service';
import Loading from '@/components/Loading';

interface FollowersListProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export default function FollowersList({ isOpen, onClose, userId, type }: FollowersListProps) {
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = type === 'followers' 
          ? await FollowerService.getFollowers(userId)
          : await FollowerService.getFollowing(userId);
        
        if (mounted) {
          setUsers(data);
        }
      } catch (err) {
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center py-8">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white capitalize">{type}</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loading size="sm" text={`Loading ${type}...`} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">No {type} yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-lg border-2 border-zinc-600">
                      {(user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-zinc-500">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}