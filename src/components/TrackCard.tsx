import { Track } from '@/types/track';
import { formatDuration, formatNumber } from '@/utils/format';

interface TrackCardProps {
  track: Track;
}

export default function TrackCard({ track }: TrackCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all group">
      <div className="flex items-center gap-4">
        <TrackArtwork thumbnail={track.thumbnail} title={track.title} />
        <TrackInfo track={track} />
        <TrackStats viewCount={track.viewCount} />
      </div>
    </div>
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
}

function TrackInfo({ track }: TrackInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-zinc-100 truncate group-hover:text-white">
        {track.title}
      </h3>
      <p className="text-sm text-zinc-400 truncate">
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

