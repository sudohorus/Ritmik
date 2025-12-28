import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-zinc-100">
            <Head>
                <title>Privacy Policy - Ritmik</title>
            </Head>
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-zinc-400 mb-12">Last updated: December 2025</p>

                <div className="space-y-12 text-zinc-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p>
                            We value your privacy. This policy explains what data we collect and how we use it.
                            In short: we only collect what is necessary to make Ritmik work for you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                            <li><strong>Account Info:</strong> Your email, username, and profile picture (if you upload one).</li>
                            <li><strong>Usage Data:</strong> We track your listening history (to show your "Top Tracks" and "Recently Played") and the playlists you create.</li>
                            <li><strong>Technical Data:</strong> Basic logs for security and debugging (IP address, browser type).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Third-Party Services</h2>
                        <p className="mb-4">
                            Ritmik integrates with other platforms. When you play music, these services may also collect data:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                            <li><strong>YouTube:</strong> By using the player, you are subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-white underline">YouTube Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline">Google Privacy Policy</a>.</li>
                            <li><strong>Spotify:</strong> If you import playlists, we interact with Spotify's API.</li>
                            <li><strong>Supabase:</strong> We use Supabase to securely store your account data.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies</h2>
                        <p>
                            We use cookies (or local storage) primarily to keep you logged in and remember your preferences (like volume settings).
                            We do not use cookies for advertising tracking.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
                        <p>
                            You have the right to access, update, or delete your data. You can delete your account at any time from the Settings page, which will remove your personal data from our database.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Changes</h2>
                        <p>
                            We may update this policy from time to time. If we make significant changes, we will notify you through the app.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="border-t border-zinc-800 mt-24">
                <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500">
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <span>© {new Date().getFullYear()} Ritmik</span>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
