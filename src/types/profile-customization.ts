export type BackgroundMode = 'banner' | 'full-bg';

export interface FavoriteMusic {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    videoId: string;
    custom_title?: string;
    custom_artist?: string;
    custom_thumbnail?: string;
}

export interface ProfileCustomization {
    id: string;
    user_id: string;
    background_mode: BackgroundMode;
    background_blur: number;
    background_brightness: number;
    avatar_decoration_id?: string | null;
    avatar_decoration?: {
        image_url: string;
        name: string;
    };
    favorite_music?: FavoriteMusic | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileCustomizationUpdate {
    background_mode?: BackgroundMode;
    background_blur?: number;
    background_brightness?: number;
    avatar_decoration_id?: string | null;
    favorite_music?: FavoriteMusic | null;
}

export const DEFAULT_CUSTOMIZATION: Omit<ProfileCustomization, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
    background_mode: 'banner',
    background_blur: 0,
    background_brightness: 100,
    avatar_decoration_id: null,
    favorite_music: null,
};
