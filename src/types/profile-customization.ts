export type BackgroundMode = 'banner' | 'full-bg';

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
    created_at: string;
    updated_at: string;
}

export interface ProfileCustomizationUpdate {
    background_mode?: BackgroundMode;
    background_blur?: number;
    background_brightness?: number;
    avatar_decoration_id?: string | null;
}

export const DEFAULT_CUSTOMIZATION: Omit<ProfileCustomization, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
    background_mode: 'banner',
    background_blur: 0,
    background_brightness: 100,
    avatar_decoration_id: null,
};
