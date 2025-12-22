import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Toaster } from 'react-hot-toast';
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { JamProvider } from "@/contexts/JamContext";
import { PlayerModeProvider } from "@/contexts/PlayerModeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Player from "@/components/Player/Player";
import AmbientBackground from "@/components/Layout/AmbientBackground";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const hidePlayer = router.pathname === '/login' || router.pathname === '/signup';

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

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlayerProvider>
          <JamProvider>
            <PlayerModeProvider>
              <ThemeProvider>
                <AmbientBackground />
                <div className="relative z-10">
                  <Component {...pageProps} />
                </div>
                <div style={{ display: hidePlayer ? 'none' : 'block' }}>
                  <Player key="global-player" />
                </div>
              </ThemeProvider>
            </PlayerModeProvider>
          </JamProvider>
        </PlayerProvider>
      </AuthProvider>
      <Toaster />
    </ErrorBoundary>
  );
}