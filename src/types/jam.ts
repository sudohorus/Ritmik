import { Track } from './track';

export interface JamSession {
    id: string;
    host_user_id: string;
    name: string;
    code: string;
    is_active: boolean;
    current_track_id: string | null;
    current_position: number;
    is_playing: boolean;
    queue: Track[];
    max_participants: number;
    created_at: string;
    updated_at: string;
    ended_at: string | null;
}

export interface JamParticipant {
    id: string;
    jam_session_id: string;
    user_id: string;
    joined_at: string;
    left_at: string | null;
    is_active: boolean;
    last_seen: string;
    user?: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
}

export interface JamState {
    currentTrack: Track | null;
    position: number;
    isPlaying: boolean;
    queue: Track[];
}

export interface CreateJamData {
    name: string;
}

export interface JoinJamData {
    code: string;
}

export interface UpdateJamStateData {
    current_track_id?: string | null;
    current_position?: number;
    is_playing?: boolean;
    queue?: Track[];
}
