import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PublicProfileService, PublicProfile } from '@/services/public-profile-service';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowers } from '@/hooks/followers/useFollowers';
import UserMenu from '@/components/Auth/UserMenu';
import Loading from '@/components/Loading';
import FollowButton from '@/components/Followers/FollowButton';
import FollowersList from '@/components/Followers/FollowersList';

export default function PublicProfilePage() {
  const router = useRouter();
  const { query, isReady } = router;
  const { username } = query;
  const normalizedUsername = Array.isArray(username) ? username[0] : username;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState<'followers' | 'following' | null>(null);
  
  const { stats: followerStats, refresh: refreshFollowers } = useFollowers(profile?.id);

  const handleFollowChange = useCallback(() => {
    refreshFollowers();
  }, [refreshFollowers]);

  useEffect(() => {
    if (!isReady || !normalizedUsername) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setPlaylists([]);

      const { data: profileData, error: profileError } = await PublicProfileService.getProfileByUsername(normalizedUsername);

      if (!active) return;

      if (profileError || !profileData) {
        setError('User not found');
        setProfile(null);
        setPlaylists([]);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: playlistsData } = await PublicProfileService.getUserPlaylists(profileData.id);

      if (!active) return;

      setPlaylists(playlistsData || []);
      setLoading(false);
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [isReady, normalizedUsername]);

  if (loading) {
    return <Loading fullScreen text="Loading profile..." />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold tracking-tight hover:text-zinc-300 transition-colors mr-8">
                Ritmik
              </Link>
            </div>
            {currentUser && <UserMenu />}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User not found</h1>
            <Link href="/" className="text-blue-500 hover:underline">
              Go back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || 'User';
  const avatarLetter = (profile.username || 'U')[0].toUpperCase();
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-zinc-300 transition-colors mr-8">
              Ritmik
            </Link>
            {currentUser && (
              <nav className="flex items-center gap-6">
                <Link href="/playlists" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  My Playlists
                </Link>
                <Link href="/explore" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Explore
                </Link>
              </nav>
            )}
          </div>
          {currentUser && <UserMenu />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-end gap-6 mb-8">
            <div className="shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-32 h-32 rounded-full object-cover shadow-2xl border-2 border-zinc-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-5xl shadow-2xl border-2 border-zinc-600">
                  {avatarLetter}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 pb-2">
              <h1 className="text-5xl font-bold mb-2 truncate">{displayName}</h1>
              <p className="text-zinc-400 text-lg mb-4">@{profile.username}</p>
              
              <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                <button
                  onClick={() => setShowFollowersModal('followers')}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-semibold text-white">{followerStats.followerCount}</span> {followerStats.followerCount === 1 ? 'follower' : 'followers'}
                </button>
                <span>•</span>
                <button
                  onClick={() => setShowFollowersModal('following')}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-semibold text-white">{followerStats.followingCount}</span> following
                </button>
                <span>•</span>
                <span>{playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}</span>
              </div>
              
              <div className="text-xs text-zinc-500">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/10"
                >
                  Edit Profile
                </Link>
              ) : (
                <FollowButton 
                  userId={profile.id} 
                  username={profile.username || undefined}
                  onFollowChange={handleFollowChange}
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Public Playlists</h2>
          
          {playlists.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <p className="text-zinc-400">No public playlists yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
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
                  {playlist.description && (
                    <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{playlist.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <FollowersList
        isOpen={showFollowersModal !== null}
        onClose={() => setShowFollowersModal(null)}
        userId={profile.id}
        type={showFollowersModal || 'followers'}
      />
    </div>
  );
}