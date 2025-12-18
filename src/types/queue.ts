import { Track } from '@/types/track';

export interface QueueItemProps {
    track: Track;
    index: number;
    isCurrent: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onRemove: () => void;
}

export interface QueueViewProps {
    isOpen: boolean;
    onClose: () => void;
}
