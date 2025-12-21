import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/Auth/UserMenu';
import Loading from '@/components/Loading';
import { ProfileService } from '@/services/profile-service';
import ProfilePreview from '@/components/Settings/ProfilePreview';
import { User } from '@/types/auth';
import Navbar from '@/components/Navbar';
import { showToast } from '@/lib/toast';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const initialLoadDone = useRef(false);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      if (!initialLoadDone.current) {
        setUsername(user.username || '');
        setDisplayName(user.display_name || '');
        setAvatarUrl(user.avatar_url || '');
        setBannerUrl(user.banner_url || '');
        initialLoadDone.current = true;
      } else if (user.banner_url && !bannerUrl) {
        setBannerUrl(user.banner_url);
      }
    }
  }, [user, bannerUrl]);

  if (authLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      showToast.error('Username must be at least 3 characters');
      return;
    }

    const updates: any = {};
    if (username !== user.username) updates.username = username;
    if (displayName !== user.display_name) updates.display_name = displayName;
    if (avatarUrl !== user.avatar_url) updates.avatar_url = avatarUrl || null;
    if (bannerUrl !== user.banner_url) updates.banner_url = bannerUrl || null;

    if (Object.keys(updates).length === 0) {
      showToast.success('No changes to save');
      return;
    }

    setSaving(true);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Update timeout')), 10000)
      );

      const updatePromise = ProfileService.updateProfile(user.id, updates);

      const { data, error: updateError } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (updateError) {
        if (updateError.code === 'USERNAME_TAKEN' || updateError.message?.includes('username')) {
          showToast.error('This username is already taken. Please choose another one.');
        } else {
          showToast.error(updateError.message || 'Failed to update profile');
        }
      } else {
        showToast.success('Profile updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (username || user.email || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/settings" className="hover:text-white transition-colors">
            Settings
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white">Account</span>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Profile Settings</h1>
          <p className="text-zinc-400">Customize your profile information</p>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-8 border border-zinc-800">
          <ProfilePreview
            user={user}
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
            bannerUrl={bannerUrl}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-3xl border-2 border-zinc-600">
                    {avatarLetter}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {displayName || username || user.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                required
                minLength={3}
                placeholder="username"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-zinc-500">At least 3 characters. This will be your unique identifier.</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-zinc-300 mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="Your display name"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-zinc-500">This is how your name appears to others.</p>
            </div>

            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="https://example.com/avatar.jpg"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-zinc-500">URL to your profile picture.</p>
            </div>

            <div>
              <label htmlFor="bannerUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                Banner URL
              </label>
              <input
                id="bannerUrl"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                placeholder="https://example.com/banner.jpg"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-zinc-500">URL to your profile banner image.</p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
