import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Player from "@/components/Player/Player";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hidePlayer = router.pathname === '/login' || router.pathname === '/signup';

  return (
    <AuthProvider>
      <PlayerProvider>
        <Component {...pageProps} />
        {!hidePlayer && <Player />}
      </PlayerProvider>
    </AuthProvider>
  );
}
