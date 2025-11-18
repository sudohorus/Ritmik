import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PlayerProvider } from "@/contexts/PlayerContext";
import Player from "@/components/Player/Player";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlayerProvider>
      <Component {...pageProps} />
      <Player />
    </PlayerProvider>
  );
}
