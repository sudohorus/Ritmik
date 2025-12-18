export interface TrackOptionsMenuProps {
    videoId: string;
    title: string;
    artist?: string;
    onRemove?: () => void;
    onAddToPlaylist?: () => void;
    showRemove?: boolean;
}
