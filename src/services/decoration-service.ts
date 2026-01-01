import { supabase } from '@/lib/supabase';
import { AvatarDecoration } from '@/types/avatar-decoration';

export const DecorationService = {
    async getAvailableDecorations(userId: string): Promise<AvatarDecoration[]> {
        const { data: freeDecorations, error: freeError } = await supabase
            .from('avatar_decorations')
            .select('*')
            .eq('is_free', true);

        if (freeError) {
            console.error('Error fetching free decorations:', freeError);
            return [];
        }

        const { data: userDecorations, error: userError } = await supabase
            .from('user_decorations')
            .select('decoration:avatar_decorations(*)')
            .eq('user_id', userId);

        if (userError) {
            console.error('Error fetching user decorations:', userError);
            return freeDecorations || [];
        }

        const ownedDecorations = userDecorations
            .map((ud: any) => ud.decoration)
            .filter(Boolean) as AvatarDecoration[];

        const allDecorations = [...(freeDecorations || []), ...ownedDecorations];

        const uniqueDecorations = Array.from(new Map(allDecorations.map(item => [item.id, item])).values());

        return uniqueDecorations;
    },

    async equipDecoration(userId: string, decorationId: string | null): Promise<{ success: boolean; error?: any }> {
        const { error: upsertError } = await supabase
            .from('profile_customization')
            .upsert({ user_id: userId, avatar_decoration_id: decorationId }, { onConflict: 'user_id' });

        if (upsertError) {
            console.error('Error equipping decoration:', upsertError);
            return { success: false, error: upsertError };
        }

        return { success: true };
    },

    async claimDecoration(userId: string, decorationId: string): Promise<{ success: boolean; error?: any }> {
        const { error } = await supabase
            .from('user_decorations')
            .insert({ user_id: userId, decoration_id: decorationId });

        if (error) {
            if (error.code === '23505') return { success: true };

            console.error('Error claiming decoration:', error);
            return { success: false, error };
        }

        return { success: true };
    },

    async getDecorationByName(name: string): Promise<AvatarDecoration | null> {
        const { data, error } = await supabase
            .from('avatar_decorations')
            .select('*')
            .eq('name', name)
            .single();

        if (error) return null;
        return data;
    },

    async claimDecorationSecure(decorationName: string): Promise<{ success: boolean; error?: any }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                return { success: false, error: 'Not authenticated' };
            }

            const response = await fetch('/api/decorations/claim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ decorationName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.error || 'Failed to claim decoration' };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }
};
