import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function TermsOfUse() {
    return (
        <div className="min-h-screen bg-black text-zinc-100">
            <Head>
                <title>Terms of Use - Ritmik</title>
            </Head>
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
                <p className="text-zinc-400 mb-12">Last updated: December 2025</p>

                <div className="space-y-12 text-zinc-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Welcome to Ritmik</h2>
                        <p>
                            Welcome! Ritmik is a music platform designed to be clean, focused, and respectful.
                            By using our service, you agree to these terms. We want this to be a safe place for everyone to enjoy music.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Respect and Community</h2>
                        <p className="mb-4">
                            We believe in a friendly and inclusive community. When using Ritmik (creating playlists, setting profile pictures, etc.), you agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-400">
                            <li><strong>Be respectful:</strong> Do not post hate speech, harassment, or abusive content.</li>
                            <li><strong>Keep it clean:</strong> Do not upload NSFW, pornographic, or explicitly violent imagery. We use automated tools to check for this.</li>
                            <li><strong>Follow the law:</strong> Do not use the service for any illegal activities.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Content and Music</h2>
                        <p className="mb-4">
                            <strong>Your Content:</strong> You own the playlists and descriptions you create. By posting them, you give us permission to display them on the platform.
                        </p>
                        <p>
                            <strong>Music Rights:</strong> Ritmik does not host music files. All audio is streamed directly from third-party services like YouTube.
                            All rights to the music belong to the respective artists and rights holders. We are simply a player/interface.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Account Security</h2>
                        <p>
                            You are responsible for keeping your account secure. If you think someone has accessed your account, please let us know immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer</h2>
                        <p>
                            Ritmik is provided "as is". We try our best to keep it running smoothly, but we can't guarantee it will always be perfect.
                            We are not responsible for any issues caused by third-party services (like YouTube being down).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Contact</h2>
                        <p>
                            Have questions or concerns? Reach out to us via our <Link href="https://github.com/sudohorus/Ritmik" className="text-white underline">GitHub repository</Link>.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="border-t border-zinc-800 mt-24">
                <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500">
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <span>© {new Date().getFullYear()} Ritmik</span>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
