import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Music, Users, PlayCircle, LayoutList, Zap, Volume2, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { PlaylistService } from '@/services/playlist-service';
import { Playlist } from '@/types/playlist';
import PlaylistCard from '@/components/Playlist/PlaylistCard';

export default function LandingPage() {
  const [glitchText, setGlitchText] = useState("noise");
  const [isChaos, setIsChaos] = useState(false);
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/search');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout(() => {
        setGlitchText("chaos");
        setIsChaos(true);
      }, 0);

      setTimeout(() => {
        setGlitchText("noise");
        setIsChaos(false);
      }, 100);

      setTimeout(() => {
        setGlitchText("chaos");
        setIsChaos(true);
      }, 200);

      setTimeout(() => {
        setGlitchText("noise");
        setIsChaos(false);
      }, 450);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const { data } = await PlaylistService.getPublicPlaylists(1, 20);
      const withImages = (data || []).filter(p => p.cover_image_url);
      const shuffled = withImages.sort(() => Math.random() - 0.5).slice(0, 4);
      setPublicPlaylists(shuffled);
    } catch (error) {
      console.error('Error fetching public playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  return (
    <div className="min-h-screen text-zinc-100">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-zinc-900/20 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 pt-32 pb-32 relative text-center">
          <div className="flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
              Music, without the{" "}
              <span className={`relative inline-block transition-colors duration-75 ${isChaos ? 'text-red-500' : ''}`}>
                {glitchText}
              </span>.
            </h1>
            <p className="text-zinc-400 text-xl mb-8 max-w-2xl leading-relaxed">
              Ritmik is a clean music platform built for people who care about focus. No ads, no distractions — just your music, organized your way.
            </p>
            <p className="text-zinc-500 mb-12 max-w-2xl leading-relaxed text-lg">
              Create playlists, import your library from Spotify or YouTube, follow people with great taste and read lyrics in real time while listening.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup" className="px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-all hover:shadow-lg text-lg">
                Create account
              </Link>
              <Link href="/explore" className="px-8 py-4 rounded-full border border-zinc-700 hover:bg-zinc-900 hover:border-zinc-600 transition-all text-lg">
                Explore
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee-container py-8 border-y border-zinc-900 bg-zinc-950/50 backdrop-blur-sm z-10">
        <div className="marquee-wrapper">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="marquee-content flex items-center text-zinc-800 font-bold text-6xl tracking-tighter select-none">
              <span className="text-zinc-900 mx-4">•</span>
              <span>NO ADS</span>
              <span className="text-zinc-900 mx-4">•</span>
              <span>NO ALGORITHMS</span>
              <span className="text-zinc-900 mx-4">•</span>
              <span>JUST MUSIC</span>
              <span className="text-zinc-900 mx-4">•</span>
              <span>YOUR LIBRARY</span>
              <span className="text-zinc-900 mx-4">•</span>
              <span>UNIFIED</span>
            </div>

          ))}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl font-bold mb-4">Discover community taste</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Explore public playlists created by users who care about music as much as you do.
          </p>
        </div>

        {loadingPlaylists && publicPlaylists.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : publicPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
            {publicPlaylists.map((playlist) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <PlaylistCard playlist={playlist} disableLink={true} />
              </motion.div>
            ))}
          </div>
        ) : !loadingPlaylists && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 mb-32">
            <p className="text-zinc-500">No public playlists found at the moment.</p>
            <button
              onClick={fetchPlaylists}
              className="mt-4 text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-24 mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-700 transition-all duration-300">
                <Zap className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">No Ads, Ever</h3>
              <p className="text-zinc-500 max-w-xs leading-relaxed">
                Your listening experience is sacred. We never interrupt it with advertisements.
              </p>
            </div>

            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-700 transition-all duration-300">
                <LayoutList className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">You Control the Queue</h3>
              <p className="text-zinc-500 max-w-xs leading-relaxed">
                No random songs added to your playlist. You decide exactly what plays next.
              </p>
            </div>

            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-700 transition-all duration-300">
                <Volume2 className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Clean Interface</h3>
              <p className="text-zinc-500 max-w-xs leading-relaxed">
                A minimalist design that gets out of the way and focuses on what matters: your music.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-32">
        <div className="rounded-3xl bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-12 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to listen differently?</h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join Ritmik today and experience music the way it was meant to be heard: without distractions, without interruptions, without noise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-all hover:shadow-xl">
              Create free account
            </Link>
            <Link href="/explore" className="px-8 py-4 rounded-lg border border-zinc-700 hover:bg-zinc-900 hover:border-zinc-600 transition-all">
              Explore music
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <span>© {new Date().getFullYear()} Ritmik. All rights reserved.</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="https://discord.gg/Vb6Pfyddjz" target="_blank" className="hover:text-white transition-colors">Discord</Link>
            <Link href="https://github.com/sudohorus/Ritmik" target="_blank" className="hover:text-white transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div >
  );
}
