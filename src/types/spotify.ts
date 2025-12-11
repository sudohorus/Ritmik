export interface SpotifyConnection {
    id: string;
    user_id: string;
    spotify_user_id: string;
    access_token: string;
    refresh_token: string;
    token_expires_at: string;
    connected_at: string;
    last_synced_at?: string;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
    tracks: { total: number };
    owner: { display_name: string };
    public: boolean;
    collaborative: boolean;
}

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    duration_ms: number;
    album: {
        name: string;
        images: Array<{ url: string }>;
    };
}

export interface SpotifyPlaylistTracksResponse {
    items: Array<{
        track: SpotifyTrack;
        added_at: string;
    }>;
    next: string | null;
    total: number;
}

export interface ImportProgress {
    current: number;
    total: number;
    track: {
        name: string;
        artist: string;
        spotifyId: string;
    };
    match?: {
        id: string;
        title: string;
        thumbnail: string;
        artist: string;
    };
    status: 'searching' | 'found' | 'not_found' | 'added' | 'error';
    error?: string;
}

export interface ImportSummary {
    total: number;
    successful: number;
    failed: number;
    notFound: number;
    duration: number;
}

export interface SpotifyUserProfile {
    id: string;
    display_name: string;
    email?: string;
    images: Array<{ url: string }>;
}
