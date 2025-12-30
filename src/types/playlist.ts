export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_url?: string | null;
  banner_image_url?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  track_count?: number;
  users?: {
    username?: string;
    display_name?: string;
  };
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  video_id: string;
  title: string;
  artist?: string;
  thumbnail_url?: string;
  duration?: number;
  position: number;
  added_at: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  is_public?: boolean;
  cover_image_url?: string | null;
  banner_image_url?: string | null;
}

export interface AddTrackToPlaylistData {
  playlist_id: string;
  track_id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
}

