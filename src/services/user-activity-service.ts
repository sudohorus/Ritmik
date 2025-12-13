import { supabase } from '@/lib/supabase';
import { Track } from '@/types/track';
import { SettingsService } from './settings-service';

export const UserActivityService = {
    async updateActivity(userId: string, currentTrack: Track | null): Promise<void> {
        const settings = await SettingsService.getUserSettings(userId);
        if (!settings?.show_activity) {
            return;
        }

        const { error } = await supabase
            .from('user_activity')
            .upsert({ user_id: userId, current_track: currentTrack, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error updating user activity:', error);
        }
    },

    async getActivity(userId: string): Promise<Track | null> {
        const { data, error } = await supabase
            .from('user_activity')
            .select('current_track')
            .eq('user_id', userId)
            .single();

        if (error) {
            return null;
        }
        return data?.current_track;
    }
};
