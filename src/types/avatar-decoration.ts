export interface AvatarDecoration {
    id: string;
    name: string;
    description: string | null;
    image_url: string;
    type: 'static' | 'animated';
    is_free: boolean;
    created_at: string;
}

export interface UserDecoration {
    id: string;
    user_id: string;
    decoration_id: string;
    acquired_at: string;
    decoration?: AvatarDecoration; 
}

export interface DecorationService {
    getAvailableDecorations(userId: string): Promise<AvatarDecoration[]>;
    equipDecoration(userId: string, decorationId: string | null): Promise<{ success: boolean; error?: any }>;
}
