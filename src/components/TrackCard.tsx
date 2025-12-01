import { useState } from 'react';
import { Track } from '@/types/track';
import { formatDuration, formatNumber } from '@/utils/format';
import { usePlayer } from '@/hooks/player/usePlayer';
import { useAuth } from '@/contexts/AuthContext';
import AddToPlaylistModal from './Playlist/AddToPlaylistModal';

interface TrackCardProps {
  track: Track;
  playlist?: Track[];
}

export default function TrackCard({ track, playlist }: TrackCardProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { user } = useAuth();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const isCurrentTrack = currentTrack?.videoId === track.videoId;

  const handleClick = () => {
    playTrack(track, playlist);
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddToPlaylist(true);
  };

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="relative" onClick={handleClick}>
            <TrackArtwork thumbnail={track.thumbnail} title={track.title} />
            {isCurrentTrack && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
                {isPlaying ? (
                  <div className="flex items-end gap-1 h-6">
                    <div className="w-1 bg-white rounded-sm equalizer-bar-1" />
                    <div className="w-1 bg-white rounded-sm equalizer-bar-2" />
                    <div className="w-1 bg-white rounded-sm equalizer-bar-3" />
                    <div className="w-1 bg-white rounded-sm equalizer-bar-4" />
                  </div>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            )}
          </div>
          <div onClick={handleClick} className="flex-1 min-w-0">
            <TrackInfo track={track} isPlaying={isCurrentTrack && isPlaying} />
          </div>
          {/* <div onClick={handleClick}>
            <TrackStats viewCount={track.viewCount} />
          </div> */}
          {user && (
            <button
              onClick={handleAddToPlaylist}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-700 rounded-lg transition-all"
              title="Add to playlist"
            >
              <svg className="w-5 h-5 text-zinc-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <AddToPlaylistModal
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        track={track}
      />
    </>
  );
}

interface TrackArtworkProps {
  thumbnail: string;
  title: string;
}

function TrackArtwork({ thumbnail, title }: TrackArtworkProps) {
  return (
    <img
      src={thumbnail}
      alt={title}
      className="w-16 h-16 rounded-md object-cover bg-zinc-800"
    />
  );
}

interface TrackInfoProps {
  track: Track;
  isPlaying?: boolean;
}

function TrackInfo({ track, isPlaying }: TrackInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className={`font-semibold truncate group-hover:text-white transition-colors ${isPlaying ? 'text-white' : 'text-zinc-100'}`}>
        {track.title}
      </h3>
      <p className={`text-sm truncate ${isPlaying ? 'text-zinc-300' : 'text-zinc-400'}`}>
        {track.artist}
      </p>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs text-zinc-600">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
}

interface TrackStatsProps {
  viewCount: number;
}

function TrackStats({ viewCount }: TrackStatsProps) {
  return (
    <div className="text-right">
      <div className="text-sm text-zinc-400">{formatNumber(viewCount)}</div>
      <div className="text-xs text-zinc-600">views</div>
    </div>
  );
}

