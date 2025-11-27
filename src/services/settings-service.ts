import { supabase } from '@/lib/supabase';

export interface UserSettings {
  followers_public: boolean;
  following_public: boolean;
  playlists_default_public: boolean;
  show_activity: boolean;
}

export class SettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            followers_public: true,
            following_public: true,
            playlists_default_public: true,
            show_activity: true,
          };
        }
        throw error;
      }

      return {
        followers_public: data.followers_public,
        following_public: data.following_public,
        playlists_default_public: data.playlists_default_public,
        show_activity: data.show_activity,
      };
    } catch (err) {
      return null;
    }
  }

  static async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          followers_public: settings.followers_public,
          following_public: settings.following_public,
          playlists_default_public: settings.playlists_default_public,
          show_activity: settings.show_activity,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError && updateError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            followers_public: settings.followers_public,
            following_public: settings.following_public,
            playlists_default_public: settings.playlists_default_public,
            show_activity: settings.show_activity,
          });

        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }
    } catch (err) {
      throw err;
    }
  }

  static async checkFollowersPublic(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.followers_public ?? true;
  }

  static async checkFollowingPublic(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.following_public ?? true;
  }
}