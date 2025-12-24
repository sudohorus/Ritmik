import { supabase } from '@/lib/supabase';
import { ProfileCustomization, ProfileCustomizationUpdate, DEFAULT_CUSTOMIZATION } from '@/types/profile-customization';

export class ProfileCustomizationService {
    static async getCustomization(userId: string): Promise<ProfileCustomization> {
        const { data, error } = await supabase
            .from('profile_customization')
            .select('*, avatar_decoration:avatar_decorations(name, image_url)')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile customization:', error);
            throw error;
        }

        if (!data) {
            return {
                id: '',
                user_id: userId,
                ...DEFAULT_CUSTOMIZATION,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        return data;
    }

    static async upsertCustomization(
        userId: string,
        updates: ProfileCustomizationUpdate
    ): Promise<{ data: ProfileCustomization | null; error: any }> {
        const { data: existing } = await supabase
            .from('profile_customization')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            const { data, error } = await supabase
                .from('profile_customization')
                .update(updates)
                .eq('user_id', userId)
                .select('*, avatar_decoration:avatar_decorations(name, image_url)')
                .single();

            return { data, error };
        } else {
            const { data, error } = await supabase
                .from('profile_customization')
                .insert({
                    user_id: userId,
                    ...updates,
                })
                .select('*, avatar_decoration:avatar_decorations(name, image_url)')
                .single();

            return { data, error };
        }
    }

    static async resetCustomization(userId: string): Promise<{ data: ProfileCustomization | null; error: any }> {
        return this.upsertCustomization(userId, DEFAULT_CUSTOMIZATION);
    }

    static async deleteCustomization(userId: string): Promise<{ error: any }> {
        const { error } = await supabase
            .from('profile_customization')
            .delete()
            .eq('user_id', userId);

        return { error };
    }
}
