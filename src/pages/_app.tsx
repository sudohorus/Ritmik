import "@/styles/globals.css"
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Player from "@/components/Player/Player";

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
    <AuthProvider>
      <PlayerProvider>
        <Component {...pageProps} />
        {!hidePlayer && <Player />}
      </PlayerProvider>
    </AuthProvider>
  );
}