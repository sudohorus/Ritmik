import { Track } from '@/types/track';
import TrackCard from './TrackCard';

interface TrackListProps {
  tracks: Track[];
  title: string;
}

export default function TrackList({ tracks, title }: TrackListProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-300 mb-4">{title}</h2>
      <div className="grid gap-3">
        {tracks.map((track, index) => (
          <TrackCard key={`${track.videoId}-${index}`} track={track} playlist={tracks} />
        ))}
      </div>
    </div>
  );
}

