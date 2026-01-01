import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import BannerImage from '@/components/BannerImage';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PublicProfileService, PublicProfile } from '@/services/public-profile-service';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowers } from '@/hooks/followers/useFollowers';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import FollowButton from '@/components/Followers/FollowButton';
import FollowersList from '@/components/Followers/FollowersList';
import { UserActivityService } from '@/services/user-activity-service';
import UserActivityDisplay from '@/components/UserActivityDisplay';
import BetaBadge from '@/components/BetaBadge';
import { Track } from '@/types/track';
import { ProfileCustomizationService } from '@/services/profile-customization-service';
import { ProfileCustomization, DEFAULT_CUSTOMIZATION } from '@/types/profile-customization';
import AvatarDecorationOverlay from '@/components/AvatarDecorationOverlay';
import { usePlayer } from '@/contexts/PlayerContext';

export default function PublicProfilePage() {
  const router = useRouter();
  const { query, isReady } = router;
  const { username } = query;
  const normalizedUsername = Array.isArray(username) ? username[0] : username;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [activity, setActivity] = useState<Track | null>(null);
  const [customization, setCustomization] = useState<ProfileCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState<'followers' | 'following' | null>(null);

  const { stats: followerStats, refresh: refreshFollowers } = useFollowers(profile?.id);

  const handleFollowChange = useCallback(() => {
    refreshFollowers();
  }, [refreshFollowers]);

  const handleCloseModal = useCallback(() => {
    setShowFollowersModal(null);
    refreshFollowers();
  }, [refreshFollowers]);

  const handleFollowersClick = () => {
    if (followerStats.followersVisible) {
      setShowFollowersModal('followers');
    }
  };

  const handleFollowingClick = () => {
    if (followerStats.followingVisible) {
      setShowFollowersModal('following');
    }
  };

  const { playTrack } = usePlayer();

  const handlePlayFavorite = () => {
    if (!customization?.favorite_music) return;

    const track: Track = {
      id: customization.favorite_music.id || customization.favorite_music.videoId,
      videoId: customization.favorite_music.videoId,
      title: customization.favorite_music.custom_title || customization.favorite_music.title,
      artist: customization.favorite_music.custom_artist || customization.favorite_music.artist,
      thumbnail: customization.favorite_music.custom_thumbnail || customization.favorite_music.thumbnail,
      channel: '',
      duration: 0,
      viewCount: 0
    };

    playTrack(track);
  };

  useEffect(() => {
    if (!isReady || !normalizedUsername) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        setPlaylists([]);
        setActivity(null);

        const { data: profileData, error: profileError } = await PublicProfileService.getProfileByUsername(normalizedUsername);

        if (!active) return;

        if (profileError || !profileData) {
          setError('User not found');
          setProfile(null);
          setPlaylists([]);
          return;
        }

        setProfile(profileData);

        let canViewActivity = false;
        if (currentUser) {
          if (currentUser.id === profileData.id) {
            canViewActivity = true;
          } else {
            const { data: followData } = await supabase
              .from('followers')
              .select('id')
              .eq('follower_id', profileData.id)
              .eq('following_id', currentUser.id)
              .maybeSingle();

            if (followData) {
              canViewActivity = true;
            }
          }
        }

        if (canViewActivity) {
          const activityData = await UserActivityService.getActivity(profileData.id);
          if (active) setActivity(activityData);
        }

        const { data: playlistsData } = await PublicProfileService.getUserPlaylists(profileData.id);

        try {
          const customizationData = await ProfileCustomizationService.getCustomization(profileData.id);
          if (active) setCustomization(customizationData);
        } catch (error) {
          if (active) {
            setCustomization({
              id: '',
              user_id: profileData.id,
              ...DEFAULT_CUSTOMIZATION,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        if (!active) return;

        setPlaylists(playlistsData || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (active) {
          setError('An error occurred while loading the profile');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [isReady, normalizedUsername, currentUser?.id]);

  if (loading) {
    return <Loading fullScreen text="Loading profile..." />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen text-zinc-100 pb-24">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">User not found</h1>
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

  const activeCustomization = customization || {
    id: '',
    user_id: profile.id,
    ...DEFAULT_CUSTOMIZATION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const backgroundBlur = `${activeCustomization.background_blur}px`;
  const backgroundBrightness = activeCustomization.background_brightness / 100;
  const isFullBg = activeCustomization.background_mode === 'full-bg';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 sm:pb-32 relative">
      {profile.banner_url && (
        <div
          className={`absolute z-0 ${isFullBg ? 'inset-0' : 'top-0 left-0 right-0 h-[50vh] max-h-[500px]'}`}
        >
          <BannerImage
            src={profile.banner_url}
            alt=""
            blur={backgroundBlur}
            brightness={backgroundBrightness}
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/0 via-zinc-950/50 to-zinc-950 z-10" />
        </div>
      )}

      <div className="absolute top-20 right-4 z-40 md:top-24 md:right-8">
        <BetaBadge createdAt={profile.created_at} className="scale-125" />
      </div>

      <Navbar />

      <div className="relative z-10">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pt-20 md:pt-32">
          <div className="mb-8 md:hidden">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4 relative inline-block">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-24 h-24 rounded-full object-cover shadow-2xl border-2 border-zinc-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-4xl shadow-2xl border-2 border-zinc-600">
                    {avatarLetter}
                  </div>
                )}

                {customization?.avatar_decoration && (
                  <AvatarDecorationOverlay decoration={customization.avatar_decoration as any} />
                )}
              </div>

              <h1 className="text-3xl font-bold mb-1 truncate w-full px-4">{displayName}</h1>
              <p className="text-zinc-400 text-base mb-4">@{profile.username}</p>

              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4 flex-wrap justify-center">
                {followerStats.followersVisible || isOwnProfile ? (
                  <button
                    onClick={handleFollowersClick}
                    className="hover:text-white transition-colors"
                  >
                    <span className="font-semibold text-white">{followerStats.followerCount}</span>{' '}
                    {followerStats.followerCount === 1 ? 'follower' : 'followers'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="font-semibold text-zinc-400">{followerStats.followerCount}</span>
                    <span>{followerStats.followerCount === 1 ? 'follower' : 'followers'}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}

                <span>•</span>

                {followerStats.followingVisible || isOwnProfile ? (
                  <button
                    onClick={handleFollowingClick}
                    className="hover:text-white transition-colors"
                  >
                    <span className="font-semibold text-white">{followerStats.followingCount}</span> following
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="font-semibold text-zinc-400">{followerStats.followingCount}</span>
                    <span>following</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}

                <span>•</span>
                <span>{playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}</span>
              </div>

              <div className="text-xs text-zinc-500 mb-4">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>

              <div className="w-full px-4">
                {isOwnProfile ? (
                  <Link
                    href="/settings/account"
                    className="block w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/10 text-center"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <FollowButton
                    userId={profile.id}
                    username={profile.username || undefined}
                    onFollowChange={handleFollowChange}
                    className="w-full text-center justify-center bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-sm py-2.5"
                  />
                )}
              </div>

              {activity && (
                <div className="w-full flex justify-center mt-4">
                  <UserActivityDisplay track={activity} username={profile.username || 'User'} />
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="shrink-0 relative">
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

                {customization?.avatar_decoration && (
                  <AvatarDecorationOverlay decoration={customization.avatar_decoration as any} />
                )}
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <h1 className="text-5xl font-bold mb-2 truncate">{displayName}</h1>
                <p className="text-zinc-400 text-lg mb-2">@{profile.username}</p>

                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                  {followerStats.followersVisible || isOwnProfile ? (
                    <button
                      onClick={handleFollowersClick}
                      className="hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">{followerStats.followerCount}</span>{' '}
                      {followerStats.followerCount === 1 ? 'follower' : 'followers'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-500 cursor-not-allowed">
                      <span className="font-semibold text-zinc-400">{followerStats.followerCount}</span>
                      <span>{followerStats.followerCount === 1 ? 'follower' : 'followers'}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}

                  <span>•</span>

                  {followerStats.followingVisible || isOwnProfile ? (
                    <button
                      onClick={handleFollowingClick}
                      className="hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">{followerStats.followingCount}</span> following
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-500 cursor-not-allowed">
                      <span className="font-semibold text-zinc-400">{followerStats.followingCount}</span>
                      <span>following</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}

                  <span>•</span>
                  <span>{playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}</span>
                </div>

                <div className="text-xs text-zinc-500 mb-4">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>

                {activity && (
                  <div className="hidden md:block">
                    <UserActivityDisplay track={activity} username={profile.username || 'User'} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <Link
                    href="/settings/account"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/10"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <FollowButton
                    userId={profile.id}
                    username={profile.username || undefined}
                    onFollowChange={handleFollowChange}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {customization?.favorite_music && (
            <div className="mb-8">
              <div
                onClick={handlePlayFavorite}
                className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-white/10 group cursor-pointer hover:bg-zinc-900/60 transition-colors"
              >
                <div className="absolute inset-0 bg-linear-to-r from-zinc-900/90 via-zinc-900/60 to-transparent z-10" />

                <div className="absolute inset-0 opacity-30 blur-xl scale-110">
                  <img
                    src={customization.favorite_music.custom_thumbnail || customization.favorite_music.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative z-20 p-4 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shadow-lg shrink-0 relative group/image">
                    <img
                      src={customization.favorite_music.custom_thumbnail || customization.favorite_music.thumbnail}
                      alt={customization.favorite_music.custom_title || customization.favorite_music.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                      <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/80 border border-white/5">
                        Favorite Track
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white truncate drop-shadow-md">
                      {customization.favorite_music.custom_title || customization.favorite_music.title}
                    </h3>
                    <p className="text-zinc-300 truncate drop-shadow-md font-medium">
                      {customization.favorite_music.custom_artist || customization.favorite_music.artist}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Public Playlists</h2>
              {playlists.length > 12 && (
                <Link
                  href={`/u/${profile.username}/playlists`}
                  className="text-sm text-zinc-400 hover:text-white hover:underline transition-all"
                >
                  View all
                </Link>
              )}
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <p className="text-zinc-400">No public playlists yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {playlists.slice(0, 12).map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
                  >
                    <div className="aspect-square bg-zinc-800 rounded-lg mb-3 sm:mb-4 flex items-center justify-center overflow-hidden">
                      {playlist.cover_image_url ? (
                        <img
                          src={playlist.cover_image_url}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1 truncate group-hover:text-white transition-colors">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-xs sm:text-sm text-zinc-400 mb-2 line-clamp-2">{playlist.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        <FollowersList
          isOpen={showFollowersModal !== null}
          onClose={handleCloseModal}
          userId={profile.id}
          type={showFollowersModal || 'followers'}
        />
      </div>
    </div>
  );
}