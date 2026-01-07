import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'react-hot-toast';
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { JamProvider } from "@/contexts/JamContext";
import { PlayerModeProvider } from "@/contexts/PlayerModeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Player from "@/components/Player/Player";
import AmbientBackground from "@/components/Layout/AmbientBackground";
import OnboardingModal from "@/components/Onboarding/OnboardingModal";
import DecorationManager from "@/components/Managers/DecorationManager";
import { usePlayer } from "@/contexts/PlayerContext";
import { TrackService } from "@/services/track-service";
import { showToast } from "@/lib/toast";

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { playTrack } = usePlayer();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hidePlayer = router.pathname === '/login' || router.pathname === '/signup';

  useEffect(() => {
    const playParam = router.query.play;
    if (playParam && typeof playParam === 'string') {
      const fetchAndPlay = async () => {
        try {
          const { play, ...rest } = router.query;
          router.replace({
            pathname: router.pathname,
            query: rest,
          }, undefined, { shallow: true });

          const response = await TrackService.search(playParam);
          const track = response.data?.[0];

          if (track && track.videoId === playParam) {
            playTrack(track);
          } else if (track) {
            playTrack(track);
          } else {
            showToast.error("Track not found");
          }
        } catch (error) {
          showToast.error("Failed to play track");
        }
      };
      fetchAndPlay();
    }
  }, [router.query.play, playTrack, router]);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      setIsNavigating(true);
    };

    const handleRouteChangeComplete = (url: string) => {
      setTimeout(() => {
        setIsNavigating(false);
      }, 100);
    };

    const handleRouteChangeError = (err: any, url: string) => {
      setIsNavigating(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  useEffect(() => {
    if (user && user.has_completed_onboarding === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10">
        <Component {...pageProps} />
      </div>
      <div style={{ display: hidePlayer ? 'none' : 'block' }}>
        <Player key="global-player" />
      </div>

      <DecorationManager />

      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onClose={async () => {
            setShowOnboarding(false);
            await refreshUser();
          }}
        />
      )}
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlayerProvider>
          <JamProvider>
            <PlayerModeProvider>
              <ThemeProvider>
                <AppContent {...props} />
              </ThemeProvider>
            </PlayerModeProvider>
          </JamProvider>
        </PlayerProvider>
      </AuthProvider>
      <Toaster />
      <Analytics />
    </ErrorBoundary>
  );
}