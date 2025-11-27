import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FollowerService, FollowerUser } from '@/services/follower-service';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/Loading';
import FollowButton from '@/components/Followers/FollowButton';

interface FollowersListProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export default function FollowersList({ isOpen, onClose, userId, type }: FollowersListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Joined today';
    if (diffDays === 1) return 'Joined yesterday';
    if (diffDays < 30) return `Joined ${diffDays} days ago`;
    if (diffDays < 365) return `Joined ${Math.floor(diffDays / 30)} months ago`;
    return `Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  const handleFollowChange = (targetUserId: string, isNowFollowing: boolean) => {
    if (type === 'following' && 
        currentUser?.id === userId && 
        !isNowFollowing) {
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center py-8">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{type}</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {users.length} {users.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            {users.length > 0 && (
              <div className="relative">
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" 
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
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors text-sm"
                />
              </div>
            )}
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loading size="sm" text={`Loading ${type}...`} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-zinc-400">
                  {searchQuery ? 'No users found matching your search' : `No ${type} yet`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const displayName = user.display_name || user.username || 'User';
                  const avatarLetter = (user.username || 'U')[0].toUpperCase();
                  const isCurrentUser = currentUser?.id === user.id;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-zinc-800/50 transition-all group border border-transparent hover:border-zinc-700"
                    >
                      <Link
                        href={`/u/${user.username}`}
                        onClick={onClose}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={displayName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 group-hover:border-zinc-600 transition-colors shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-xl border-2 border-zinc-600 group-hover:border-zinc-500 transition-colors shrink-0">
                            {avatarLetter}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate group-hover:text-zinc-100 transition-colors">
                            {displayName}
                          </p>
                          <p className="text-sm text-zinc-500 truncate">@{user.username}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </Link>

                      {!isCurrentUser && currentUser && (
                        <div className="shrink-0">
                          <FollowButton 
                            userId={user.id} 
                            username={user.username || undefined}
                            onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}