import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { SettingsService, UserSettings } from '@/services/settings-service';
import { showToast } from '@/lib/toast';

export default function AppearanceSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { setIsAmbientEnabled } = useTheme();

    const [settings, setSettings] = useState<UserSettings>({
        followers_public: true,
        following_public: true,
        show_activity: true,
        allow_statistics_tracking: false,
        ambient_background: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        let mounted = true;

        const loadSettings = async () => {
            setLoading(true);
            try {
                const data = await SettingsService.getUserSettings(user.id);
                if (mounted && data) {
                    setSettings(data);
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            mounted = false;
        };
    }, [user]);

    if (authLoading || !user) {
        return <Loading fullScreen text="Loading..." />;
    }

    const handleSave = async () => {
        setSaving(true);

        try {
            await SettingsService.updateUserSettings(user.id, settings);
            showToast.success('Appearance settings saved successfully!');
        } catch (err) {
            showToast.error(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
                    <Link href="/settings" className="hover:text-white transition-colors">
                        Settings
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-white">Appearance</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3">Appearance</h1>
                    <p className="text-zinc-400">Customize how Ritmik looks and feels</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <Loading text="Loading appearance settings..." />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
                            <h2 className="text-xl font-bold mb-6">Visual Effects</h2>

                            <div className="space-y-4">
                                {/* Ambient Background */}
                                <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                    <div className="flex-1 pr-4">
                                        <label htmlFor="ambient_background" className="text-base font-medium text-zinc-200 cursor-pointer block mb-1">
                                            Ambient Background (Mood Ring)
                                        </label>
                                        <p className="text-sm text-zinc-500">
                                            When enabled, the background dynamically changes color based on the currently playing track's album art.
                                        </p>
                                        {settings.ambient_background ? (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-green-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Ambient background is enabled</span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <span>Ambient background is disabled</span>
                                            </div>
                                        )}
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            id="ambient_background"
                                            type="checkbox"
                                            checked={settings.ambient_background}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSettings(prev => ({ ...prev, ambient_background: checked }));
                                                setIsAmbientEnabled(checked);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <Link
                                href="/settings"
                                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
