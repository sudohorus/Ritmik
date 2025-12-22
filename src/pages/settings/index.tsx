import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <Loading fullScreen text="Loading..." />;
  }

  const settingsMenu = [
    {
      title: 'Account',
      description: 'Manage your account information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/settings/account',
      items: ['Username', 'Display name', 'Avatar', 'Email'],
    },
    {
      title: 'Privacy',
      description: 'Control who can see your information',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      href: '/settings/privacy',
      items: ['Followers visibility', 'Following visibility', 'Playlist defaults', 'Activity'],
    },
    {
      title: 'Integrations',
      description: 'Connect external music services',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      href: '/settings/integrations',
      items: ['Spotify'],
    },
    {
      title: 'Appearance',
      description: 'Customize how Ritmik looks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      href: '/settings/appearance',
      items: ['Theme', 'Display density', 'Animations'],
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      href: '/settings/notifications',
      items: ['Email notifications', 'Push notifications', 'Activity alerts'],
      badge: 'Coming Soon',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Settings</h1>
          <p className="text-zinc-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsMenu.map((section) => (
            <Link
              key={section.href}
              href={section.badge ? '#' : section.href}
              className={`bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 transition-all group ${section.badge
                ? 'cursor-not-allowed opacity-60'
                : 'hover:border-zinc-700 hover:bg-zinc-800/50'
                }`}
              onClick={(e) => section.badge && e.preventDefault()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-zinc-400 ${!section.badge && 'group-hover:text-white'} transition-colors`}>
                    {section.icon}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${!section.badge && 'group-hover:text-white'} transition-colors`}>
                      {section.title}
                    </h3>
                    <p className="text-sm text-zinc-500">{section.description}</p>
                  </div>
                </div>
                {section.badge ? (
                  <span className="px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-400 rounded-md">
                    {section.badge}
                  </span>
                ) : (
                  <svg
                    className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-2 py-1 bg-zinc-800/50 text-zinc-400 rounded-md"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}