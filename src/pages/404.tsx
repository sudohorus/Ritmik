import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Custom404() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-8xl font-bold text-white mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-white mb-2">Track Not Found</h2>
                    <p className="text-zinc-400">
                        Looks like this page hit a wrong note. Let's get you back on track.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                    >
                        Go Back
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors inline-block"
                    >
                        Go to Home
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800">
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <Link href="/playlists" className="text-zinc-400 hover:text-white transition-colors">
                            My Playlists
                        </Link>
                        <Link href="/explore" className="text-zinc-400 hover:text-white transition-colors">
                            Explore
                        </Link>
                        <Link href="/stats" className="text-zinc-400 hover:text-white transition-colors">
                            Stats
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
