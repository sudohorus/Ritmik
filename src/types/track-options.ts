import { Track } from './track';

export interface TrackOptionsMenuProps {
    videoId: string;
    title: string;
    artist?: string;
    thumbnail?: string;
    duration?: number;
    onRemove?: () => void;
    onAddToPlaylist?: () => void;
    showRemove?: boolean;
    track?: Track;
}
