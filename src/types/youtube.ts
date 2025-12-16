export interface YoutubePlaylist {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    videoCount: string;
    tracks?: YoutubeTrack[];
}

export interface YoutubeTrack {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: number;
    videoId: string;
}

export interface YoutubeImportProgress {
    current: number;
    total: number;
    track: {
        name: string;
        artist: string;
        videoId: string;
    };
    status: 'pending' | 'added' | 'error';
    error?: string;
}

export interface YoutubeImportSummary {
    total: number;
    successful: number;
    failed: number;
    duration: number;
}
